/**
 * 移动端新增工单功能
 * 文件路径: static/js/mobile/ticket-add.js
 */

var isSubmitting = false;
var uploadedImages = [];

/**
 * 处理图片上传
 * @param {HTMLInputElement} input - 文件输入框元素
 */
function handleImageUpload(input) {
    var files = input.files;
    if (!files || files.length === 0) return;
    
    var previewContainer = document.getElementById('descriptionPreview');
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        
        // 压缩图片
        compressImage(file, function(compressedData) {
            uploadedImages.push(compressedData);
            
            // 创建预览
            var previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = '<img src="' + compressedData + '"><span class="delete-img" onclick="deleteImage(this, ' + (uploadedImages.length - 1) + ')">×</span>';
            previewContainer.appendChild(previewItem);
        });
    }
    
    // 清空input，允许重复选择同一文件
    input.value = '';
}

/**
 * 压缩图片
 * @param {File} file - 图片文件
 * @param {Function} callback - 压缩完成后的回调函数
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
 * @param {HTMLElement} btn - 删除按钮元素
 * @param {number} index - 图片索引
 */
function deleteImage(btn, index) {
    uploadedImages.splice(index, 1);
    btn.parentElement.remove();
}

/**
 * 提交表单
 */
function submitForm() {
    if (isSubmitting) {
        return;
    }

    var form = document.getElementById('addForm');

    // 简单验证
    var title = form.title.value.trim();
    var description = form.description.value.trim();

    if (!title) {
        showToast('请输入工单标题', 'error');
        return;
    }
    if (description.length < 5) {
        showToast('详细描述不能少于5个字', 'error');
        return;
    }

    // 设置提交状态，防止重复提交
    isSubmitting = true;
    showLoading('提交中...');

    // 收集表单数据
    var data = {
        title: form.title.value.trim(),
        priority: form.priority.value,
        status: form.status.value,
        assignee_name: form.assignee_name.value,
        description: form.description.value.trim()
    };

    // 添加图片数据
    if (uploadedImages.length > 0) {
        data.image_references_str_description = JSON.stringify(uploadedImages);
    }

    // 提交数据
    fetch('/system/ticket/save', {
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
            showToast('提交成功', 'success');
            setTimeout(function() {
                window.location.href = '/system/ticket/?mobile=1';
            }, 1500);
        } else {
            showToast(res.msg || '提交失败', 'error');
            isSubmitting = false;
        }
    })
    .catch(function(error) {
        hideLoading();
        showToast('提交失败: ' + error.message, 'error');
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

// 导航函数已移至 common.js
