from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, decode_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from geopy.distance import geodesic
import os
import requests
from datetime import timedelta as td
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, '..', '.env'))
load_dotenv(os.path.join(BASE_DIR, '.env'))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'build')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///crm.db')
# app.config['SQLALCHEMY_DATABASE_URI'] ='postgresql://postgres:786786@localhost:5432/CRM'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.config['GOOGLE_CLIENT_ID'] = os.environ.get('GOOGLE_CLIENT_ID')
app.config['GOOGLE_CLIENT_SECRET'] = os.environ.get('GOOGLE_CLIENT_SECRET')
app.config['FRONTEND_URL'] = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:3000",
        "https://your-production-frontend.com"  # Replace with your actual production domain
    ]}},
    supports_credentials=True
)

# JWT Error Handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'message': 'The token has expired',
        'error': 'token_expired'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'message': 'Signature verification failed',
        'error': 'invalid_token'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'message': 'Request does not contain an access token',
        'error': 'authorization_required'
    }), 401

# Database models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='sales_rep')
    customers = db.relationship('Customer', backref='created_by_user', lazy=True)
    interactions = db.relationship('Interaction', backref='user', lazy=True)
    locations = db.relationship('Location', backref='user', lazy=True)

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    company = db.Column(db.String(100))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    stage = db.Column(db.String(20), default='New')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    interactions = db.relationship('Interaction', backref='customer', lazy=True)

class Interaction(db.Model):
    __tablename__ = 'interactions'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(20))
    note = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/')
def serve_react():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 409
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password,
        role=data.get('role', 'sales_rep')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400
    user = User.query.filter_by(email=email).first()
    # Always respond with success to avoid revealing whether user exists
    if not user:
        return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
    reset_token = create_access_token(identity=user.id, expires_delta=td(minutes=15), additional_claims={'password_reset': True})
    frontend_url = app.config.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    reset_url = f"{frontend_url}/reset-password/{reset_token}"

    # Attempt to send email if SMTP environment is configured
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    smtp_use_tls = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'
    from_email = os.environ.get('SMTP_FROM', smtp_user)

    email_sent = False
    if smtp_host and smtp_user and smtp_pass and from_email:
      try:
        msg = EmailMessage()
        msg['Subject'] = 'Reset your CRM password'
        msg['From'] = from_email
        msg['To'] = email
        msg.set_content(f"Click the link below to reset your password:\n\n{reset_url}\n\nThis link expires in 15 minutes.")
        if smtp_use_tls:
          with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            email_sent = True
        else:
          with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            email_sent = True
      except Exception:
        email_sent = False

    return jsonify({'message': 'Password reset link generated', 'reset_url': reset_url, 'email_sent': email_sent}), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    if not token or not new_password:
        return jsonify({'message': 'Token and new_password are required'}), 400
    try:
        decoded = decode_token(token)
        claims = decoded.get('claims', {})
        if not claims.get('password_reset'):
            return jsonify({'message': 'Invalid reset token'}), 400
        user_id = decoded.get('sub')
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({'message': 'Password reset successful'}), 200
    except Exception:
        return jsonify({'message': 'Invalid or expired reset token'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    }), 200

@app.route('/api/login/google', methods=['POST'])
def login_google():
    data = request.get_json()
    id_token = data.get('id_token')
    if not id_token:
        return jsonify({'message': 'id_token is required'}), 400
    try:
        # Verify ID token via Google tokeninfo endpoint
        verify_resp = requests.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': id_token})
        if verify_resp.status_code != 200:
            return jsonify({'message': 'Invalid Google token'}), 401
        token_info = verify_resp.json()
        aud = token_info.get('aud')
        email = token_info.get('email')
        name = token_info.get('name') or email
        email_verified = token_info.get('email_verified') in ['true', True]
        client_id = app.config.get('GOOGLE_CLIENT_ID')
        if client_id and aud != client_id:
            return jsonify({'message': 'Token audience mismatch'}), 401
        if not email or not email_verified:
            return jsonify({'message': 'Email not verified with Google'}), 401
        user = User.query.filter_by(email=email).first()
        if not user:
            # Create user if doesn't exist
            generated_password = os.urandom(16).hex()
            user = User(name=name, email=email, password_hash=generate_password_hash(generated_password), role='sales_rep')
            db.session.add(user)
            db.session.commit()
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        }), 200
    except Exception:
        return jsonify({'message': 'Failed to authenticate with Google'}), 401

@app.route('/api/customers', methods=['GET'])
@jwt_required()
def get_customers():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user.role == 'admin':
        customers = Customer.query.all()
    else:
        customers = Customer.query.filter_by(created_by=current_user_id).all()
    result = []
    for customer in customers:
        result.append({
            'id': customer.id,
            'name': customer.name,
            'email': customer.email,
            'phone': customer.phone,
            'company': customer.company,
            'lat': customer.lat,
            'lng': customer.lng,
            'stage': customer.stage,
            'created_by': customer.created_by,
            'created_at': customer.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    return jsonify(result), 200

@app.route('/api/customers/<int:id>', methods=['GET'])
@jwt_required()
def get_customer(id):
    current_user_id = get_jwt_identity()
    customer = Customer.query.get(id)
    if not customer:
        return jsonify({'message': 'Customer not found'}), 404
    
    user = User.query.get(current_user_id)
    if user.role != 'admin' and customer.created_by != current_user_id:
        return jsonify({'message': 'Permission denied'}), 403
    
    return jsonify({
        'id': customer.id,
        'name': customer.name,
        'email': customer.email,
        'phone': customer.phone,
        'company': customer.company,
        'lat': customer.lat,
        'lng': customer.lng,
        'stage': customer.stage,
        'created_by': customer.created_by,
        'created_at': customer.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }), 200

@app.route('/api/customers', methods=['POST'])
@jwt_required()
def create_customer():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    new_customer = Customer(
        name=data['name'],
        email=data.get('email'),
        phone=data.get('phone'),
        company=data.get('company'),
        lat=data.get('lat'),
        lng=data.get('lng'),
        stage=data.get('stage', 'New'),
        created_by=current_user_id
    )
    db.session.add(new_customer)
    db.session.commit()
    return jsonify({
        'id': new_customer.id,
        'name': new_customer.name,
        'message': 'Customer created successfully'
    }), 201

@app.route('/api/customers/<int:id>', methods=['PUT'])
@jwt_required()
def update_customer(id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    customer = Customer.query.get(id)
    if not customer:
        return jsonify({'message': 'Customer not found'}), 404
    user = User.query.get(current_user_id)
    if user.role != 'admin' and customer.created_by != current_user_id:
        return jsonify({'message': 'Permission denied'}), 403
    customer.name = data.get('name', customer.name)
    customer.email = data.get('email', customer.email)
    customer.phone = data.get('phone', customer.phone)
    customer.company = data.get('company', customer.company)
    customer.lat = data.get('lat', customer.lat)
    customer.lng = data.get('lng', customer.lng)
    customer.stage = data.get('stage', customer.stage)
    db.session.commit()
    return jsonify({'message': 'Customer updated successfully'}), 200

@app.route('/api/customers/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_customer(id):
    current_user_id = get_jwt_identity()
    customer = Customer.query.get(id)
    if not customer:
        return jsonify({'message': 'Customer not found'}), 404
    user = User.query.get(current_user_id)
    if user.role != 'admin' and customer.created_by != current_user_id:
        return jsonify({'message': 'Permission denied'}), 403
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'message': 'Customer deleted successfully'}), 200

@app.route('/api/interactions', methods=['GET'])
@jwt_required()
def get_interactions():
    current_user_id = get_jwt_identity()
    customer_id = request.args.get('customer_id')
    if customer_id:
        interactions = Interaction.query.filter_by(customer_id=customer_id).all()
    else:
        user = User.query.get(current_user_id)
        if user.role == 'admin':
            interactions = Interaction.query.all()
        else:
            interactions = Interaction.query.filter_by(user_id=current_user_id).all()
    result = []
    for interaction in interactions:
        result.append({
            'id': interaction.id,
            'customer_id': interaction.customer_id,
            'user_id': interaction.user_id,
            'type': interaction.type,
            'note': interaction.note,
            'timestamp': interaction.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
    return jsonify(result), 200

@app.route('/api/interactions', methods=['POST'])
@jwt_required()
def create_interaction():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    new_interaction = Interaction(
        customer_id=data['customer_id'],
        user_id=current_user_id,
        type=data.get('type', 'note'),
        note=data.get('note', '')
    )
    db.session.add(new_interaction)
    db.session.commit()
    return jsonify({
        'id': new_interaction.id,
        'message': 'Interaction logged successfully'
    }), 201

@app.route('/api/interactions/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_interaction(id):
    current_user_id = get_jwt_identity()
    interaction = Interaction.query.get(id)
    if not interaction:
        return jsonify({'message': 'Interaction not found'}), 404
    
    user = User.query.get(current_user_id)
    if user.role != 'admin' and interaction.user_id != current_user_id:
        return jsonify({'message': 'Permission denied'}), 403
    
    db.session.delete(interaction)
    db.session.commit()
    return jsonify({'message': 'Interaction deleted successfully'}), 200

@app.route('/api/locations', methods=['POST'])
@jwt_required()
def update_location():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    new_location = Location(
        user_id=current_user_id,
        latitude=data['latitude'],
        longitude=data['longitude']
    )
    db.session.add(new_location)
    db.session.commit()
    return jsonify({'message': 'Location updated successfully'}), 201

@app.route('/api/locations', methods=['GET'])
@jwt_required()
def get_locations():
    current_user_id = get_jwt_identity()
    subquery = db.session.query(
        Location.user_id,
        db.func.max(Location.timestamp).label('max_timestamp')
    ).group_by(Location.user_id).subquery('recent_locations')
    recent_locations = db.session.query(Location).join(
        subquery,
        db.and_(
            Location.user_id == subquery.c.user_id,
            Location.timestamp == subquery.c.max_timestamp
        )
    ).all()
    result = []
    for location in recent_locations:
        user = User.query.get(location.user_id)
        result.append({
            'user_id': location.user_id,
            'name': user.name,
            'latitude': location.latitude,
            'longitude': location.longitude,
            'timestamp': location.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
    return jsonify(result), 200

@app.route('/api/distance', methods=['POST'])
@jwt_required()
def calculate_distance():
    data = request.get_json()
    point1 = (data['lat1'], data['lng1'])
    point2 = (data['lat2'], data['lng2'])
    distance_km = geodesic(point1, point2).kilometers
    distance_mi = geodesic(point1, point2).miles
    
    # Calculate estimated travel time (assuming average speed of 50 km/h)
    estimated_time_hours = distance_km / 50
    estimated_time_minutes = estimated_time_hours * 60
    
    return jsonify({
        'distance_km': round(distance_km, 2),
        'distance_mi': round(distance_mi, 2),
        'estimated_time_minutes': round(estimated_time_minutes, 0),
        'estimated_time_text': f"{int(estimated_time_minutes // 60)}h {int(estimated_time_minutes % 60)}m" if estimated_time_minutes >= 60 else f"{int(estimated_time_minutes)}m"
    }), 200 
@app.route('/api/route-planning', methods=['POST'])
@jwt_required()
def route_planning():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Get user's current location
    user_location = Location.query.filter_by(user_id=current_user_id).order_by(Location.timestamp.desc()).first()
    if not user_location:
        return jsonify({'message': 'User location not available'}), 400
    
    # Get selected customer IDs
    customer_ids = data.get('customer_ids', [])
    if not customer_ids:
        return jsonify({'message': 'No customers selected'}), 400
    
    customers = Customer.query.filter(Customer.id.in_(customer_ids)).all()
    
    # Calculate distances and create route
    route_data = []
    total_distance = 0
    current_lat, current_lng = user_location.latitude, user_location.longitude
    
    for customer in customers:
        if customer.lat and customer.lng:
            distance_km = geodesic((current_lat, current_lng), (customer.lat, customer.lng)).kilometers
            estimated_time = distance_km / 50 * 60  # minutes
            
            route_data.append({
                'customer_id': customer.id,
                'customer_name': customer.name,
                'customer_company': customer.company,
                'lat': customer.lat,
                'lng': customer.lng,
                'distance_from_previous': round(distance_km, 2),
                'estimated_time_minutes': round(estimated_time, 0)
            })
            
            total_distance += distance_km
            current_lat, current_lng = customer.lat, customer.lng
    
    return jsonify({
        'route': route_data,
        'total_distance_km': round(total_distance, 2),
        'total_estimated_time_minutes': round(sum(item['estimated_time_minutes'] for item in route_data), 0),
        'starting_location': {
            'lat': user_location.latitude,
            'lng': user_location.longitude
        }
    }), 200

@app.route('/api/customer-analytics', methods=['GET'])
@jwt_required()
def customer_analytics():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role == 'admin':
        customers = Customer.query.all()
        interactions = Interaction.query.all()
    else:
        customers = Customer.query.filter_by(created_by=current_user_id).all()
        interactions = Interaction.query.filter_by(user_id=current_user_id).all()
    
    # Get customers created in the last 30 days
    thirty_days_ago = datetime.utcnow() - td(days=30)
    recent_customers = [c for c in customers if c.created_at >= thirty_days_ago]
    
    # Get interactions in the last 7 days
    seven_days_ago = datetime.utcnow() - td(days=7)
    recent_interactions = [i for i in interactions if i.timestamp >= seven_days_ago]
    
    # Calculate conversion rate
    closed_customers = [c for c in customers if c.stage == 'Closed']
    conversion_rate = (len(closed_customers) / len(customers) * 100) if customers else 0
    
    return jsonify({
        'recent_customers_count': len(recent_customers),
        'recent_interactions_count': len(recent_interactions),
        'conversion_rate': round(conversion_rate, 1),
        'avg_interactions_per_customer': round(len(interactions) / len(customers), 1) if customers else 0
    }), 200

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if user.role == 'admin':
        customers = Customer.query.all()
        interactions = Interaction.query.all()
    else:
        customers = Customer.query.filter_by(created_by=current_user_id).all()
        interactions = Interaction.query.filter_by(user_id=current_user_id).all()

    total_customers = len(customers)
    total_interactions = len(interactions)
    new_customers = sum(1 for c in customers if c.stage == 'New')
    contacted_customers = sum(1 for c in customers if c.stage == 'Contacted')
    proposal_customers = sum(1 for c in customers if c.stage == 'Proposal')
    closed_customers = sum(1 for c in customers if c.stage == 'Closed')

    return jsonify({
        'total_customers': total_customers,
        'total_interactions': total_interactions,
        'new_customers': new_customers,
        'contacted_customers': contacted_customers,
        'proposal_customers': proposal_customers,
        'closed_customers': closed_customers
    }), 200



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder="static")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists("static/" + path):
        return send_from_directory("static", path)
    else:
        return send_from_directory("static", "index.html")
