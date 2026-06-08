/**
 * 移动端公共方法库
 */
var originalFetch = window.fetch ? window.fetch.bind(window) : null;

var MobileCommon = {
  csrfHeaderName: 'X-CSRFToken',

  // 显示加载中遮罩
  showLoading: function(msg) {
    layui.layer.open({ type: 2, content: msg || '加载中...' });
  },

  // 隐藏加载中遮罩
  hideLoading: function() {
    layui.layer.closeAll('loading');
  },

  // 显示轻量提示（Toast）
  showToast: function(msg) {
    layui.layer.open({ content: msg, skin: 'msg', time: 2 });
  },

  // 显示确认对话框
  showConfirm: function(msg, callback) {
    layui.layer.open({
      content: msg,
      btn: ['确定', '取消'],
      yes: function(index) {
        layui.layer.close(index);
        if (callback) callback(true);
      },
      no: function(index) {
        layui.layer.close(index);
        if (callback) callback(false);
      }
    });
  },

  // 统一的AJAX请求封装
  request: function(options) {
    var self = this;
    if (options.loading !== false) self.showLoading();

    layui.$.ajax({
      url: options.url,
      type: options.type || 'GET',
      data: options.data || {},
      dataType: 'json',
      success: function(res) {
        self.hideLoading();
        if (res.code === 0 || res.success) {
          if (options.success) options.success(res);
        } else {
          self.showToast(res.msg || '操作失败');
          if (options.error) options.error(res);
        }
      },
      error: function() {
        self.hideLoading();
        self.showToast('网络错误');
        if (options.error) options.error();
      }
    });
  },

  getCsrfToken: function() {
    return window.MOBILE_CSRF_TOKEN || '';
  },

  shouldAttachCsrf: function(method, url) {
    var requestMethod = (method || 'GET').toUpperCase();
    if (/^(GET|HEAD|OPTIONS|TRACE)$/.test(requestMethod)) {
      return false;
    }

    if (!url) {
      return true;
    }

    try {
      var targetUrl = new URL(url, window.location.origin);
      return targetUrl.origin === window.location.origin;
    } catch (e) {
      return true;
    }
  },

  buildFetchOptions: function(input, init) {
    var request = input instanceof Request ? input : null;
    var sourceUrl = request ? request.url : input;
    var baseInit = request ? {
      method: request.method,
      headers: request.headers,
      body: init && Object.prototype.hasOwnProperty.call(init, 'body') ? init.body : undefined,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      integrity: request.integrity,
      keepalive: request.keepalive,
      signal: request.signal
    } : {};
    var options = Object.assign({}, baseInit, init || {});
    var headers = new Headers(request ? request.headers : undefined);

    if (options.headers) {
      new Headers(options.headers).forEach(function(value, key) {
        headers.set(key, value);
      });
    }

    if (this.shouldAttachCsrf(options.method, sourceUrl) && this.getCsrfToken() && !headers.has(this.csrfHeaderName)) {
      headers.set(this.csrfHeaderName, this.getCsrfToken());
    }

    options.headers = headers;
    return options;
  },

  fetch: function(input, init) {
    if (!originalFetch) {
      throw new Error('Fetch API is not available in this browser.');
    }

    return originalFetch(input, this.buildFetchOptions(input, init));
  }
};

// 暴露到全局作用域
window.MobileCommon = MobileCommon;

// 为移动端页面的同源写请求自动补充 CSRF 头。
if (window.fetch) {
  window.fetch = function(input, init) {
    return originalFetch(input, MobileCommon.buildFetchOptions(input, init));
  };
}

/**
 * 移动端通用导航函数
 * 所有页面共享的导航功能
 */

// 跳转到首页
function goToHome() {
  window.location.href = '/m';
}

// 跳转到工作看板
function goToWorkboard() {
  window.location.href = '/system/workboard/?mobile=1';
}

// 跳转到工单列表
function goToTicketList() {
  window.location.href = '/system/ticket/?mobile=1';
}

// 跳转到客户工单
function goToCustomerTickets() {
  window.location.href = '/system/ticket/customer';
}

// 跳转到产品建议
function goToProductSuggestion() {
  window.location.href = '/system/product_suggestion/?mobile=1';
}

/**
 * ==================== Toast 提示组件 ====================
 * 替代 alert 的轻量级提示，自动消失不阻断操作
 */

// 显示 Toast 提示
function showToast(message, duration) {
  duration = duration || 2000;

  // 移除已存在的 toast
  var existingToast = document.querySelector('.mobile-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 创建 toast 元素
  var toast = document.createElement('div');
  toast.className = 'mobile-toast';
  toast.innerHTML = '<span>' + message + '</span>';

  // 添加到页面
  document.body.appendChild(toast);

  // 触发重绘以启动动画
  toast.offsetHeight;

  // 显示动画
  toast.classList.add('show');

  // 自动隐藏
  setTimeout(function() {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// 显示成功提示
function showSuccess(message, duration) {
  showToastWithIcon(message, 'success', duration);
}

// 显示错误提示
function showError(message, duration) {
  showToastWithIcon(message, 'error', duration);
}

// 显示带图标的 Toast
function showToastWithIcon(message, type, duration) {
  duration = duration || 2000;

  // 移除已存在的 toast
  var existingToast = document.querySelector('.mobile-toast');
  if (existingToast) {
    existingToast.remove();
  }

  var icon = '';
  if (type === 'success') {
    icon = '<i class="fa fa-check-circle"></i>';
  } else if (type === 'error') {
    icon = '<i class="fa fa-times-circle"></i>';
  } else if (type === 'warning') {
    icon = '<i class="fa fa-exclamation-circle"></i>';
  } else if (type === 'info') {
    icon = '<i class="fa fa-info-circle"></i>';
  }

  var toast = document.createElement('div');
  toast.className = 'mobile-toast toast-' + type;
  toast.innerHTML = icon + '<span>' + message + '</span>';

  document.body.appendChild(toast);
  toast.offsetHeight;
  toast.classList.add('show');

  setTimeout(function() {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * ==================== 按钮点击反馈 ====================
 * 为所有按钮添加触摸反馈效果
 */

// 初始化按钮点击反馈
function initButtonFeedback() {
  // 为所有按钮添加触摸反馈
  document.addEventListener('touchstart', function(e) {
    var target = e.target;
    // 查找最近的按钮元素
    var button = target.closest('.btn, button, .mobile-nav-item, .submit-btn, .back-btn, .add-btn, .home-btn, .filter-btn');
    if (button) {
      button.classList.add('btn-pressing');
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    var target = e.target;
    var button = target.closest('.btn, button, .mobile-nav-item, .submit-btn, .back-btn, .add-btn, .home-btn, .filter-btn');
    if (button) {
      setTimeout(function() {
        button.classList.remove('btn-pressing');
      }, 100);
    }
  }, { passive: true });

  // 防止重复点击（防抖）
  document.addEventListener('click', function(e) {
    var target = e.target;
    var button = target.closest('.btn, button, .submit-btn');
    if (button && !button.disabled) {
      // 检查是否正在处理中
      if (button.classList.contains('btn-processing')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 标记为处理中
      button.classList.add('btn-processing');

      // 1.5秒后解除锁定
      setTimeout(function() {
        button.classList.remove('btn-processing');
      }, 1500);
    }
  }, true);
}

// 页面加载完成后初始化按钮反馈
document.addEventListener('DOMContentLoaded', initButtonFeedback);

/**
 * ==================== 下拉刷新 ====================
 * 为列表页面添加下拉刷新功能
 */

// 下拉刷新配置
var PullToRefresh = {
  // 初始化下拉刷新
  init: function(options) {
    var container = options.container || document.querySelector('.mobile-content');
    var onRefresh = options.onRefresh || function() {};
    var threshold = options.threshold || 80; // 触发刷新的下拉距离

    if (!container) return;

    var startY = 0;
    var currentY = 0;
    var isPulling = false;
    var isRefreshing = false;
    var refreshIndicator = null;

    // 创建刷新指示器
    function createIndicator() {
      var indicator = document.createElement('div');
      indicator.className = 'pull-refresh-indicator';
      indicator.innerHTML = '<i class="fa fa-arrow-down"></i><span>下拉刷新</span>';
      indicator.style.cssText = 'position: absolute; top: -60px; left: 0; right: 0; height: 60px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 14px; transition: all 0.3s ease; z-index: 100;';
      container.style.position = 'relative';
      container.insertBefore(indicator, container.firstChild);
      return indicator;
    }

    refreshIndicator = createIndicator();

    // 触摸开始
    container.addEventListener('touchstart', function(e) {
      if (isRefreshing) return;

      // 只有在顶部时才允许下拉刷新
      if (container.scrollTop <= 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });

    // 触摸移动
    container.addEventListener('touchmove', function(e) {
      if (!isPulling || isRefreshing) return;

      currentY = e.touches[0].clientY;
      var diff = currentY - startY;

      // 只有向下拉动才触发
      if (diff > 0 && container.scrollTop <= 0) {
        e.preventDefault();

        // 阻尼效果
        var pullDistance = Math.min(diff * 0.5, threshold + 20);
        container.style.transform = 'translateY(' + pullDistance + 'px)';
        container.style.transition = 'none';

        // 更新指示器状态
        if (pullDistance >= threshold) {
          refreshIndicator.innerHTML = '<i class="fa fa-arrow-up"></i><span>释放刷新</span>';
          refreshIndicator.classList.add('ready');
        } else {
          refreshIndicator.innerHTML = '<i class="fa fa-arrow-down"></i><span>下拉刷新</span>';
          refreshIndicator.classList.remove('ready');
        }
      }
    }, { passive: false });

    // 触摸结束
    container.addEventListener('touchend', function(e) {
      if (!isPulling) return;

      isPulling = false;
      var diff = currentY - startY;

      // 恢复位置
      container.style.transition = 'transform 0.3s ease';

      if (diff >= threshold && !isRefreshing) {
        // 触发刷新
        isRefreshing = true;
        container.style.transform = 'translateY(60px)';
        refreshIndicator.innerHTML = '<i class="fa fa-spinner fa-spin"></i><span>刷新中...</span>';

        // 执行刷新回调
        onRefresh(function() {
          // 刷新完成
          isRefreshing = false;
          container.style.transform = 'translateY(0)';
          setTimeout(function() {
            refreshIndicator.innerHTML = '<i class="fa fa-arrow-down"></i><span>下拉刷新</span>';
          }, 300);
        });
      } else {
        // 取消刷新
        container.style.transform = 'translateY(0)';
      }

      startY = 0;
      currentY = 0;
    }, { passive: true });
  }
};

// 暴露到全局
window.PullToRefresh = PullToRefresh;
