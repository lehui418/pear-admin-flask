from sqlalchemy import and_
from applications.extensions import db


class ModelFilter:
    """
    ORM 多条件查询构造器，支持多种查询条件组合。

    示例：
        mf = ModelFilter()
        mf.exact('name', 'John')
        mf.vague('email', 'example.com')
        query = User.query.filter(mf.get_filter(User))
    """
    filter_field = {}  # 存储字段过滤条件
    filter_list = []   # 存储最终的过滤条件列表

    # 查询类型常量
    type_exact = "exact"      # 精确匹配
    type_neq = "neq"          # 不等于
    type_greater = "greater"  # 大于
    type_less = "less"        # 小于
    type_vague = "vague"      # 模糊匹配
    type_contains = "contains"  # 包含
    type_between = "between"  # 范围查询

    def __init__(self):
        """初始化过滤条件存储字典和列表。"""
        self.filter_field = {}
        self.filter_list = []

    def exact(self, field_name, value):
        """
        添加精确匹配条件。

        :param field_name: 模型字段名称。
        :param value: 匹配的值。
        """
        if value and value != '':
            self.filter_field[field_name] = {"data": value, "type": self.type_exact}

    def neq(self, field_name, value):
        """
        添加不等于条件。

        :param field_name: 模型字段名称。
        :param value: 不匹配的值。
        """
        if value and value != '':
            self.filter_field[field_name] = {"data": value, "type": self.type_neq}

    def greater(self, field_name, value):
        """
        添加大于条件。

        :param field_name: 模型字段名称。
        :param value: 大于的值。
        """
        if value and value != '':
            self.filter_field[field_name] = {"data": value, "type": self.type_greater}

    def less(self, field_name, value):
        """
        添加小于条件。

        :param field_name: 模型字段名称。
        :param value: 小于的值。
        """
        if value and value != '':
            self.filter_field[field_name] = {"data": value, "type": self.type_less}

    def vague(self, field_name, value: str):
        """
        添加模糊匹配条件（左右模糊）。

        :param field_name: 模型字段名称。
        :param value: 模糊匹配的值。
        """
        if value and value != '':
            self.filter_field[field_name] = {"data": ('%' + value + '%'), "type": self.type_vague}

    def left_vague(self, field_name, value: str):
        """
        添加左模糊匹配条件。

        :param field_name: 模型字段名称。
        :param value: 左模糊匹配的值。
        """
        if value and value != '':
            self.filter_field[field_name] = {"data": ('%' + value), "type": self.type_vague}

    def right_vague(self, field_name, value: str):
        """
        添加右模糊匹配条件。

        :param field_name: 模型字段名称。
        :param value: 右模糊匹配的值。
        """
        if value and value != '':
            self.filter_field[field_name] = {"data": (value + '%'), "type": self.type_vague}

    def contains(self, field_name, value: str):
        """
        添加包含条件。

        :param field_name: 模型字段名称。
        :param value: 包含的值。
        """
        if value and value != '':
            self.filter_field[field_name] = {"data": value, "type": self.type_contains}

    def between(self, field_name, value1, value2):
        """
        添加范围查询条件。

        :param field_name: 模型字段名称。
        :param value1: 范围起始值。
        :param value2: 范围结束值。
        """
        if value1 and value2 and value1 != '' and value2 != '':
            self.filter_field[field_name] = {"data": [value1, value2], "type": self.type_between}

    def get_filter(self, model: db.Model):
        """
        获取最终的 SQLAlchemy 过滤条件。

        :param model: SQLAlchemy 模型类。
        :return: 返回组合后的过滤条件。
        """
        for k, v in self.filter_field.items():
            if v.get("type") == self.type_vague:
                self.filter_list.append(getattr(model, k).like(v.get("data")))
            if v.get("type") == self.type_contains:
                self.filter_list.append(getattr(model, k).contains(v.get("data")))
            if v.get("type") == self.type_exact:
                self.filter_list.append(getattr(model, k) == v.get("data"))
            if v.get("type") == self.type_neq:
                self.filter_list.append(getattr(model, k) != v.get("data"))
            if v.get("type") == self.type_greater:
                self.filter_list.append(getattr(model, k) > v.get("data"))
            if v.get("type") == self.type_less:
                self.filter_list.append(getattr(model, k) < v.get("data"))
            if v.get("type") == self.type_between:
                self.filter_list.append(getattr(model, k).between(v.get("data")[0], v.get("data")[1]))
        return and_(*self.filter_list)