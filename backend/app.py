from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from geopy.distance import geodesic
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-secret-key')
# app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///crm.db')
app.config['SQLALCHEMY_DATABASE_URI'] ='postgresql://postgres:786786@localhost:5432/CRM'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app)

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

# API Routes
@app.route('/')
def index():
    return jsonify({'message': 'CRM Backend is running. Use API endpoints like /api/login, /api/register, etc.'}), 200

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
    return jsonify({
        'distance_km': round(distance_km, 2),
        'distance_mi': round(distance_mi, 2)
    }), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
