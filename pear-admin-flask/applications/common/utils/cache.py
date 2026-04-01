import time
import hashlib
import json
from functools import wraps
from typing import Any, Callable, Optional

cache_dict = {}


def cache_set_internal(key, value, expired=5):
    """
    程序内部实现的记录缓存，用于简单、体量不大的缓存记录，在程序结束后销毁。对于高速、体量大的环境请配置 Redis 等服务自行记录。
    记录缓存，存储键值对，并记录当前时间作为缓存的时间戳。

    :param key: 键
    :param value: 值
    :param expired: 过期时间（秒），默认5秒
    """
    cache_dict[key] = {
        'value': value,
        'expired_time': time.time() + expired
    }


def cache_get_internal(key):
    """
    获取缓存，根据键从缓存中获取值，并检查是否过期。

    :param key: 键
    :return: 如果缓存存在且未过期，返回缓存的值；否则返回 None
    """
    if key in cache_dict:
        cache_item = cache_dict[key]
        if time.time() < cache_item['expired_time']:
            return cache_item['value']
        else:
            # 如果缓存已过期，删除该缓存
            del cache_dict[key]
    return None


def cache_auto_internal(key, call, expired=5):
    """
    如果缓存存在直接返回缓存内容，缓存不存在或者过期执行 call 函数，并取得返回值记录并返回。

    :param key: 键
    :param call: 获取新值的地方
    :param expired: 过期时间（秒），默认5秒
    """

    data = cache_get_internal(key)

    if data is not None:
        return data

    data = call()
    cache_set_internal(key, data, expired)

    return data


def cache_delete_internal(key):
    """
    删除指定键的缓存

    :param key: 键
    :return: 如果删除成功返回 True，否则返回 False
    """
    if key in cache_dict:
        del cache_dict[key]
        return True
    return False


def cache_clear_internal():
    """
    清空所有缓存
    """
    cache_dict.clear()


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    生成缓存键

    :param prefix: 键前缀
    :param args: 位置参数
    :param kwargs: 关键字参数
    :return: 缓存键字符串
    """
    key_data = {
        'args': args,
        'kwargs': kwargs
    }
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    hash_key = hashlib.md5(key_string.encode()).hexdigest()
    return f"{prefix}:{hash_key}"


def cached(expired: int = 60, key_prefix: str = None):
    """
    缓存装饰器，用于缓存函数返回值

    使用示例:
        @cached(expired=300, key_prefix='user_info')
        def get_user_info(user_id):
            # 查询数据库
            return user

    :param expired: 过期时间（秒），默认60秒
    :param key_prefix: 缓存键前缀，默认使用函数名
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            prefix = key_prefix or func.__name__
            cache_key = generate_cache_key(prefix, *args, **kwargs)
            
            # 尝试从缓存获取
            cached_value = cache_get_internal(cache_key)
            if cached_value is not None:
                return cached_value
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 存入缓存
            cache_set_internal(cache_key, result, expired)
            
            return result
        
        # 添加清除缓存的方法
        wrapper.cache_clear = lambda *args, **kwargs: cache_delete_internal(
            generate_cache_key(key_prefix or func.__name__, *args, **kwargs)
        )
        wrapper.cache_clear_all = lambda: _clear_cache_by_prefix(key_prefix or func.__name__)
        
        return wrapper
    return decorator


def _clear_cache_by_prefix(prefix: str):
    """
    清除指定前缀的所有缓存

    :param prefix: 缓存键前缀
    """
    keys_to_delete = [key for key in cache_dict.keys() if key.startswith(prefix)]
    for key in keys_to_delete:
        del cache_dict[key]


class CacheManager:
    """
    缓存管理器，提供更高级的缓存操作
    """
    
    @staticmethod
    def get(key: str) -> Any:
        """获取缓存值"""
        return cache_get_internal(key)
    
    @staticmethod
    def set(key: str, value: Any, expired: int = 60) -> None:
        """设置缓存值"""
        cache_set_internal(key, value, expired)
    
    @staticmethod
    def delete(key: str) -> bool:
        """删除缓存"""
        return cache_delete_internal(key)
    
    @staticmethod
    def clear() -> None:
        """清空所有缓存"""
        cache_clear_internal()
    
    @staticmethod
    def get_or_set(key: str, call: Callable, expired: int = 60) -> Any:
        """
        获取缓存，如果不存在则设置
        
        :param key: 缓存键
        :param call: 获取值的回调函数
        :param expired: 过期时间（秒）
        :return: 缓存值
        """
        return cache_auto_internal(key, call, expired)
    
    @staticmethod
    def invalidate_pattern(pattern: str) -> int:
        """
        根据模式删除缓存
        
        :param pattern: 匹配模式（支持简单的字符串包含匹配）
        :return: 删除的缓存数量
        """
        keys_to_delete = [key for key in cache_dict.keys() if pattern in key]
        for key in keys_to_delete:
            del cache_dict[key]
        return len(keys_to_delete)


# 常用缓存键前缀
CACHE_KEYS = {
    'USER_INFO': 'user_info',
    'USER_PERMISSIONS': 'user_permissions',
    'TICKET_LIST': 'ticket_list',
    'TICKET_DETAIL': 'ticket_detail',
    'DICT_DATA': 'dict_data',
    'SYSTEM_CONFIG': 'system_config',
    'DASHBOARD_STATS': 'dashboard_stats'
}
