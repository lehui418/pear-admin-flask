from flask import Blueprint, jsonify, request
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
from applications.models import Ticket
from applications.extensions import db
import logging
from applications.common.utils.http import fail_api
from applications.common.utils.rights import authorize
from applications.view.api.ticket_analytics import get_ticket_analytics_data

bp = Blueprint('ticket', __name__, url_prefix='/ticket')

@bp.route('/analytics', methods=['GET'])
def get_ticket_analytics():
    """
    获取工单分析数据
    """
    try:
        date_range = request.args.get('date_range')
        status_filter = request.args.get('status_filter')
        classification_filter = request.args.get('classification_filter')
        priority_filter = request.args.get('priority_filter')
        search = request.args.get('search')
        engineer_period = request.args.get('engineer_period')
        status_period = request.args.get('status_period')
        issue_period = request.args.get('issue_period')
        priority_period = request.args.get('priority_period')

        analytics_data, error = get_ticket_analytics_data(
            date_range=date_range,
            status_filter=status_filter,
            classification_filter=classification_filter,
            priority_filter=priority_filter,
            search=search,
            engineer_period=engineer_period,
            status_period=status_period,
            issue_period=issue_period,
            priority_chart_period=priority_period
        )

        if error:
            return fail_api(msg=error)
        
        return jsonify({
            "code": 200,
            "msg": "获取成功",
            "data": analytics_data
        })
        
    except Exception as e:
        logging.error(f"获取工单分析数据失败: {str(e)}", exc_info=True)
        return fail_api(msg="获取工单分析数据失败")

# ... other routes