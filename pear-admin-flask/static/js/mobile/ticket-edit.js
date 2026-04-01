/**
 * 移动端编辑工单功能
 * 文件路径: static/js/mobile/ticket-edit.js
 */

var isSubmitting = false;
var uploadedImages = {
    description: [],
    relatedinfo: [],
    solution: []
};

// 工单数据（由HTML页面注入）
var ticketData = window.ticketData || {};

/**
 * 解析图片数据（支持JSON数组格式和旧格式）
 * @param {string} imageStr - 图片数据字符串
 * @returns {Array} 图片数组
 */
function parseImages(imageStr) {
    if (!imageStr) return [];
    
    // 尝试解析为JSON数组（移动端格式）
    try {
        var parsed = JSON.parse(imageStr);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch(e) {
        // 不是JSON格式，继续尝试旧格式
    }
    
    // 尝试解析旧格式（PC端格式：@@IMAGE@@#id=xxx(base64data)）
    var images = [];
    if (imageStr.includes('@@IMAGE_SEPARATOR@@')) {
        var parts = imageStr.split('\n@@IMAGE_SEPARATOR@@\n');
        parts.forEach(function(part) {
            if (part && part.includes('@@IMAGE@@')) {
                // 提取base64数据
                var match = part.match(/\((data:image\/[^)]+)\)/);
                if (match) {
                    images.push(match[1]);
                }
            }
        });
    }
    return images;
}

/**
 * 页面加载时初始化
 */
function initEditPage() {
    // 加载详细描述图片
    var descriptionImages = parseImages(ticketData.image_references_str_description);
    if (descriptionImages && descriptionImages.length > 0) {
        loadExistingImages('description', descriptionImages);
    }
    
    // 加载相关日志图片
    var relatedinfoImages = parseImages(ticketData.image_references_str_relatedinfo);
    if (relatedinfoImages && relatedinfoImages.length > 0) {
        loadExistingImages('relatedinfo', relatedinfoImages);
    }
    
    // 加载处置方案图片
    var solutionImages = parseImages(ticketData.image_references_str_solution);
    if (solutionImages && solutionImages.length > 0) {
        loadExistingImages('solution', solutionImages);
    }
    
    // 绑定单选按钮样式切换
    document.querySelectorAll('.radio-item input').forEach(function(radio) {
        radio.addEventListener('change', function() {
            var name = this.name;
            document.querySelectorAll('input[name="' + name + '"]').forEach(function(r) {
                r.parentElement.classList.remove('active');
            });
            this.parentElement.classList.add('active');
        });
    });
}

/**
 * 加载已有图片
 * @param {string} type - 图片类型
 * @param {Array} images - 图片数组
 */
function loadExistingImages(type, images) {
    var previewContainer = document.getElementById(type + 'Preview');
    if (!previewContainer) return;
    
    images.forEach(function(imgData, index) {
        uploadedImages[type].push(imgData);
        
        var previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        previewItem.innerHTML = '<img src="' + imgData + '"><span class="delete-img" onclick="deleteImage(this, \'' + type + '\', ' + index + ')">×</span>';
        previewContainer.appendChild(previewItem);
    });
}

/**
 * 切换开关
 * @param {HTMLElement} btn - 开关按钮
 * @param {string} inputName - 输入框名称
 */
function toggleSwitch(btn, inputName) {
    btn.classList.toggle('active');
    var input = document.querySelector('input[name="' + inputName + '"]');
    if (input) {
        input.value = btn.classList.contains('active') ? 'true' : 'false';
    }
}

/**
 * 处理图片上传
 * @param {HTMLInputElement} input - 文件输入框
 * @param {string} type - 图片类型
 */
function handleImageUpload(input, type) {
    var files = input.files;
    if (!files || files.length === 0) return;
    
    var previewContainer = document.getElementById(type + 'Preview');
    if (!previewContainer) return;
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        
        // 压缩图片
        compressImage(file, function(compressedData) {
            uploadedImages[type].push(compressedData);
            
            // 创建预览
            var previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = '<img src="' + compressedData + '"><span class="delete-img" onclick="deleteImage(this, \'' + type + '\', ' + (uploadedImages[type].length - 1) + ')">×</span>';
            previewContainer.appendChild(previewItem);
        });
    }
    
    // 清空input，允许重复选择同一文件
    input.value = '';
}

/**
 * 压缩图片
 * @param {File} file - 图片文件
 * @param {Function} callback - 回调函数
 */
function compressImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            
            // 最大尺寸
            var maxWidth = 800;
            var maxHeight = 800;
            var width = img.width;
            var height = img.height;
            
            // 等比例缩放
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转换为base64，质量0.7
            var compressedData = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedData);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * 删除图片
 * @param {HTMLElement} btn - 删除按钮
 * @param {string} type - 图片类型
 * @param {number} index - 索引
 */
function deleteImage(btn, type, index) {
    uploadedImages[type].splice(index, 1);
    btn.parentElement.remove();
}

/**
 * 查看流程
 */
function viewFlow() {
    alert('流程功能开发中...');
}

/**
 * 返回列表页
 */
function goBack() {
    window.location.href = '/system/ticket/?mobile=1';
}

/**
 * 提交表单
 */
function submitForm() {
    if (isSubmitting) return;
    
    var form = document.getElementById('editForm');
    if (!form) return;
    
    var title = form.title.value.trim();
    
    if (!title) {
        showToast('请输入工单标题', 'error');
        return;
    }
    
    isSubmitting = true;
    
    // 显示加载状态
    showLoading('保存中...');
    
    // 收集表单数据
    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(value, key) {
        data[key] = value;
    });
    
    // 添加图片数据
    data.image_references_str_description = JSON.stringify(uploadedImages.description);
    data.image_references_str_relatedinfo = JSON.stringify(uploadedImages.relatedinfo);
    data.image_references_str_solution = JSON.stringify(uploadedImages.solution);
    
    // 提交数据
    fetch('/system/ticket/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(res) {
        hideLoading();
        if (res.code === 0 || res.success) {
            showToast('保存成功', 'success');
            setTimeout(function() {
                window.location.href = '/system/ticket/?mobile=1';
            }, 1000);
        } else {
            showToast(res.msg || '保存失败', 'error');
            isSubmitting = false;
        }
    })
    .catch(function(error) {
        hideLoading();
        showToast('保存失败: ' + error.message, 'error');
        isSubmitting = false;
    });
}

/**
 * 显示加载提示
 */
function showLoading(text) {
    var loading = document.getElementById('loadingToast');
    if (loading) {
        loading.querySelector('.loading-text').textContent = text || '加载中...';
        loading.classList.add('active');
    }
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
    var loading = document.getElementById('loadingToast');
    if (loading) {
        loading.classList.remove('active');
    }
}

/**
 * 显示Toast提示
 */
function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast ' + (type || '');
        toast.classList.add('active');
        
        setTimeout(function() {
            toast.classList.remove('active');
        }, 2000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initEditPage);

// 导航函数已移至 common.js
