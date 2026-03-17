"""
日期时间工具模块
提供统一的时间格式化、解析和转换功能
"""

from datetime import datetime
from typing import Optional, Union


# 默认时间格式
DEFAULT_DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'
DEFAULT_DATE_FORMAT = '%Y-%m-%d'
DATETIME_FORMATS = [
    '%Y-%m-%d %H:%M:%S',
    '%Y-%m-%dT%H:%M:%S',
    '%Y-%m-%d'
]


def format_datetime(value: Optional[datetime], format_str: str = DEFAULT_DATETIME_FORMAT) -> str:
    """
    将 datetime 对象格式化为字符串
    
    :param value: datetime 对象
    :param format_str: 格式化字符串，默认为 '%Y-%m-%d %H:%M:%S'
    :return: 格式化后的时间字符串，如果 value 为 None 则返回空字符串
    
    示例:
        >>> format_datetime(datetime.now())
        '2026-03-12 17:45:30'
        >>> format_datetime(None)
        ''
    """
    if isinstance(value, datetime):
        return value.strftime(format_str)
    return ""


def parse_datetime(date_str: str) -> Optional[datetime]:
    """
    解析日期时间字符串为 datetime 对象
    
    支持多种格式:
        - '%Y-%m-%d %H:%M:%S' (2026-03-12 17:45:30)
        - '%Y-%m-%dT%H:%M:%S' (2026-03-12T17:45:30)
        - '%Y-%m-%d' (2026-03-12)
    
    :param date_str: 日期时间字符串
    :return: datetime 对象，解析失败返回 None
    
    示例:
        >>> parse_datetime('2026-03-12 17:45:30')
        datetime(2026, 3, 12, 17, 45, 30)
        >>> parse_datetime('')
        None
    """
    if not date_str:
        return None
    
    for fmt in DATETIME_FORMATS:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    return None


def parse_datetime_with_logging(date_str: str, logger=None) -> Optional[datetime]:
    """
    解析日期时间字符串，失败时记录日志
    
    :param date_str: 日期时间字符串
    :param logger: 日志记录器，可选
    :return: datetime 对象，解析失败返回 None
    """
    result = parse_datetime(date_str)
    if result is None and date_str and logger:
        logger.error(f"Unable to parse datetime: {date_str}")
    return result


def datetime_to_timestamp(dt: Optional[datetime]) -> Optional[int]:
    """
    将 datetime 对象转换为时间戳（毫秒）
    
    :param dt: datetime 对象
    :return: 时间戳（毫秒），如果 dt 为 None 则返回 None
    """
    if isinstance(dt, datetime):
        return int(dt.timestamp() * 1000)
    return None


def timestamp_to_datetime(timestamp: Union[int, float]) -> Optional[datetime]:
    """
    将时间戳转换为 datetime 对象
    
    :param timestamp: 时间戳（秒或毫秒）
    :return: datetime 对象
    """
    if timestamp is None:
        return None
    
    # 判断是秒还是毫秒（毫秒通常大于 1e10）
    if timestamp > 1e10:
        timestamp = timestamp / 1000
    
    return datetime.fromtimestamp(timestamp)


def get_current_datetime() -> datetime:
    """
    获取当前日期时间
    
    :return: 当前 datetime 对象
    """
    return datetime.now()


def get_current_datetime_str(format_str: str = DEFAULT_DATETIME_FORMAT) -> str:
    """
    获取当前日期时间字符串
    
    :param format_str: 格式化字符串
    :return: 当前时间字符串
    """
    return datetime.now().strftime(format_str)
