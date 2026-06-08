from flask import jsonify


def _json_response(success: bool, msg: str, code: int, data=None, **kwargs):
    payload = {
        "success": success,
        "msg": msg,
        "code": code,
    }

    if data is not None:
        payload["data"] = data

    status_code = kwargs.pop("status_code", None)
    payload.update(kwargs)
    response = jsonify(payload)
    if status_code is not None:
        response.status_code = status_code
    return response


def success_api(msg: str = "成功", data=None, code: int = 0, **kwargs):
    """
    返回成功的 API 响应。

    :param msg: 成功消息内容，默认为 "成功"。
    :param data: 附加返回数据。
    :param code: 业务状态码，默认 0，兼容现有前端判断。
    :return: 返回 JSON 格式的响应。
    """
    return _json_response(True, msg, code, data=data, **kwargs)


def fail_api(msg: str = "失败", data=None, code: int = 1, **kwargs):
    """
    返回失败的 API 响应。

    :param msg: 失败消息内容，默认为 "失败"。
    :param data: 附加返回数据。
    :param code: 业务状态码，默认 1。
    :return: 返回 JSON 格式的响应。
    """
    return _json_response(False, msg, code, data=data, **kwargs)


def table_api(msg: str = "", count=0, data=None, limit=10):
    """
    返回动态表格渲染所需的 API 响应。

    :param msg: 响应消息内容，默认为空字符串。
    :param count: 数据总数，默认为 0。
    :param data: 表格数据，默认为 None。
    :param limit: 每页数据条数，默认为 10。
    :return: 返回 JSON 格式的响应，兼容 `code` 与 `success` 两种判断方式。
    """
    return _json_response(
        True,
        msg,
        0,
        data=data,
        count=count,
        limit=limit,
    )
