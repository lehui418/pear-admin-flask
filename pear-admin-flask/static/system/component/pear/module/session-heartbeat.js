/**
 * 会话心跳检测模块
 * 用于定期检查会话状态，防止会话超时
 */
layui.define(['jquery'], function (exports) {
    "use strict";

    var $ = layui.jquery;
    var MOD_NAME = 'sessionHeartbeat';
    
    var sessionHeartbeat = {
        // 配置项
        config: {
            // 心跳间隔时间（毫秒） - 每5分钟检查一次
            heartbeatInterval: 5 * 60 * 1000,
            // 会话超时警告时间（毫秒） - 提前5分钟警告
            warningBeforeTimeout: 5 * 60 * 1000,
            // 自动刷新间隔（毫秒） - 25分钟无操作后刷新
            autoRefreshInterval: 25 * 60 * 1000,
            // 最后活动时间键名
            lastActivityKey: 'pear-last-activity',
            // 心跳状态键名
            heartbeatStatusKey: 'pear-heartbeat-status'
        },
        
        // 定时器
        timers: {
            heartbeat: null,
            inactivity: null,
            warning: null
        },
        
        // 初始化
        init: function(options) {
            var that = this;
            
            // 合并配置
            if (options) {
                $.extend(that.config, options);
            }
            
            // 记录初始活动时间
            that.updateLastActivity();
            
            // 启动心跳检测
            that.startHeartbeat();
            
            // 绑定用户活动事件
            that.bindUserActivity();
            
            console.log('会话心跳检测已启动');
            
            return that;
        },
        
        // 更新最后活动时间
        updateLastActivity: function() {
            var that = this;
            localStorage.setItem(that.config.lastActivityKey, new Date().getTime());
        },
        
        // 获取最后活动时间
        getLastActivity: function() {
            var that = this;
            return parseInt(localStorage.getItem(that.config.lastActivityKey) || '0');
        },
        
        // 绑定用户活动事件
        bindUserActivity: function() {
            var that = this;
            var activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
            
            $.each(activityEvents, function(i, event) {
                $(document).on(event + '.heartbeat', function() {
                    that.updateLastActivity();
                });
            });
        },
        
        // 启动心跳检测
        startHeartbeat: function() {
            var that = this;
            
            // 清除现有定时器
            that.stopHeartbeat();
            
            // 心跳检测定时器
            that.timers.heartbeat = setInterval(function() {
                that.checkSession();
            }, that.config.heartbeatInterval);
            
            // 无操作检测定时器
            that.timers.inactivity = setInterval(function() {
                that.checkInactivity();
            }, 60000); // 每分钟检查一次无操作时间
        },
        
        // 停止心跳检测
        stopHeartbeat: function() {
            var that = this;
            
            if (that.timers.heartbeat) {
                clearInterval(that.timers.heartbeat);
                that.timers.heartbeat = null;
            }
            
            if (that.timers.inactivity) {
                clearInterval(that.timers.inactivity);
                that.timers.inactivity = null;
            }
            
            if (that.timers.warning) {
                clearTimeout(that.timers.warning);
                that.timers.warning = null;
            }
        },
        
        // 检查会话状态
        checkSession: function() {
            var that = this;
            
            // 发送心跳请求
            $.ajax({
                url: '/system/passport/heartbeat',
                type: 'GET',
                dataType: 'json',
                timeout: 10000,
                success: function(result) {
                    if (result.code === 1) {
                        // 会话正常
                        localStorage.setItem(that.config.heartbeatStatusKey, 'active');
                        console.log('会话心跳检测：正常');
                    } else {
                        // 会话异常
                        that.handleSessionExpired();
                    }
                },
                error: function(xhr) {
                    if (xhr.status === 401 || xhr.status === 419) {
                        // 会话已过期
                        that.handleSessionExpired();
                    } else {
                        console.warn('心跳检测失败，状态码：' + xhr.status);
                    }
                }
            });
        },
        
        // 检查无操作时间
        checkInactivity: function() {
            var that = this;
            var lastActivity = that.getLastActivity();
            var now = new Date().getTime();
            var inactiveTime = now - lastActivity;
            
            // 如果超过自动刷新时间，刷新页面
            if (inactiveTime > that.config.autoRefreshInterval) {
                console.log('长时间无操作，自动刷新页面');
                that.refreshPage();
                return;
            }
            
            // 如果接近超时时间，显示警告
            if (inactiveTime > (that.config.autoRefreshInterval - that.config.warningBeforeTimeout)) {
                if (!that.timers.warning) {
                    that.showTimeoutWarning();
                }
            }
        },
        
        // 显示超时警告
        showTimeoutWarning: function() {
            var that = this;
            
            layer.msg('您的会话即将超时，请重新操作页面以避免自动刷新', {
                icon: 7,
                time: 5000,
                btn: ['我知道了'],
                yes: function() {
                    that.updateLastActivity();
                    layer.closeAll();
                }
            });
        },
        
        // 处理会话过期
        handleSessionExpired: function() {
            var that = this;
            
            console.log('会话已过期，需要重新登录');
            
            // 停止心跳
            that.stopHeartbeat();
            
            // 显示提示
            layer.confirm('您的会话已过期，请重新登录', {
                icon: 5,
                title: '会话超时',
                btn: ['重新登录'],
                closeBtn: 0,
                anim: 6
            }, function() {
                // 跳转到登录页
                window.location.href = '/system/passport/login';
            });
        },
        
        // 刷新页面
        refreshPage: function() {
            var that = this;
            
            // 显示加载动画
            var loading = layer.load(2, {
                shade: [0.3, '#000'],
                content: '页面刷新中...',
                success: function(layero) {
                    layero.find('.layui-layer-content').css({
                        'padding-top': '40px',
                        'text-align': 'center'
                    });
                }
            });
            
            // 延迟刷新，让用户看到提示
            setTimeout(function() {
                window.location.reload();
            }, 1000);
        },
        
        // 销毁
        destroy: function() {
            var that = this;
            
            // 停止所有定时器
            that.stopHeartbeat();
            
            // 解绑事件
            $(document).off('.heartbeat');
            
            // 清除本地存储
            localStorage.removeItem(that.config.lastActivityKey);
            localStorage.removeItem(that.config.heartbeatStatusKey);
            
            console.log('会话心跳检测已停止');
        }
    };

    exports(MOD_NAME, sessionHeartbeat);
});