from applications.extensions import db
from datetime import datetime

class ProductSuggestion(db.Model):
    __tablename__ = 'product_suggestion'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(50), default='Medium')  # e.g., Low, Medium, High
    status = db.Column(db.String(50), default='Open')  # e.g., Open, In Review, Accepted, Rejected, Implemented
    creator_id = db.Column(db.Integer, nullable=False)  # 创建者ID
    creator_name = db.Column(db.String(100), nullable=False)  # 创建者名称
    
    # 产品信息字段
    product_type_level1 = db.Column(db.String(50), nullable=True)  # 产品类型一级分类
    product_type_level2 = db.Column(db.String(50), nullable=True)  # 产品类型二级分类
    
    # 创建和更新时间
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f'<ProductSuggestion {self.id}: {self.title}>'