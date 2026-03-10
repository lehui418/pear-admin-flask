from flask import Blueprint, render_template, jsonify, request
from applications.common.utils.rights import authorize

bp = Blueprint('workboard', __name__, url_prefix='/workboard')

import traceback

@bp.get('/')
@authorize("system:workboard:main")
def main():
    try:
        return render_template('system/workboard/main.html')
    except Exception as e:
        print("Error in workboard main route:")
        traceback.print_exc()
        # Optionally, re-raise the exception or return a custom error page
        # raise e
        return "Internal Server Error", 500

@bp.route('/data', methods=['GET'])
@authorize("system:workboard:main")
def get_workboard_data():
    """
    工单看板数据接口
    """
    mock_data = {
        "code": 200,
        "data": {
            "todayAccess": 150,
            "submissionCount": 35,
            "downloadCount": 89,
            "traffic": 2456,
            "chartCategories": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "chartSeries": [120, 200, 150, 80, 70, 110, 130]
        },
        "message": "success"
    }
    return jsonify(mock_data)

def register_workboard_views(app):
    app.register_blueprint(bp)