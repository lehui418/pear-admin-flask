/**
 * 移动端产品建议编辑功能
 * 文件路径: static/js/mobile/product-suggestion-edit.js
 */

// 图片数组
var imageUrls = [];
var IMAGE_VIEW_URL_PREFIX = '/system/upload/image/';
var UPLOAD_IMAGE_URL = '/system/upload/image';

// 返回上一页
function goBack() {
    window.history.back();
}

// 页面加载时提取已有图片
window.onload = function() {
    extractExistingImages();
};

// 从现有描述中提取图片引用
function extractExistingImages() {
    var description = document.getElementById('description').value;
    var imageRegex = /!\[图片\]\(([^#]+)#id=([^)]+)\)/g;
    var match;

    while ((match = imageRegex.exec(description)) !== null) {
        imageUrls.push({
            url: match[1],
            id: match[2],
            reference: match[0]
        });
    }

    // 清除描述中的图片引用
    var cleanDescription = description.replace(imageRegex, '').trim();
    document.getElementById('description').value = cleanDescription;

    displayImages();
    updateImageReferences();
}

// 显示图片列表
function displayImages() {
    var container = document.getElementById('imageList');
    var html = '';

    imageUrls.forEach(function(imageInfo, index) {
        var displayUrl = IMAGE_VIEW_URL_PREFIX + imageInfo.id;
        html += '<div class="image-item">';
        html += '<img src="' + displayUrl + '" alt="图片">';
        html += '<button type="button" class="remove-btn" onclick="removeImage(' + index + ')">×</button>';
        html += '</div>';
    });

    container.innerHTML = html;
}

// 处理图片选择
function handleImageSelect(event) {
    var file = event.target.files[0];
    if (file) {
        uploadImage(file);
    }
}

// 上传图片
function uploadImage(file) {
    var formData = new FormData();
    formData.append('file', file);

    fetch(UPLOAD_IMAGE_URL, {
        method: 'POST',
        body: formData
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(res) {
        if (res.success) {
            var imageUrl = res.data.url;
            var photoId = res.data.photo_id;
            var imageReference = '![图片](' + imageUrl + '#id=' + photoId + ')';

            imageUrls.push({
                url: imageUrl,
                id: photoId,
                reference: imageReference
            });

            displayImages();
            updateImageReferences();
            showToast('图片上传成功', 'success');
        } else {
            showToast('图片上传失败: ' + res.message, 'error');
        }
    })
    .catch(function(err) {
        console.error('上传失败:', err);
        showToast('图片上传失败', 'error');
    });
}

// 移除图片
function removeImage(index) {
    imageUrls.splice(index, 1);
    displayImages();
    updateImageReferences();
}

// 更新图片引用隐藏字段
function updateImageReferences() {
    var references = imageUrls.map(function(imageInfo) {
        return imageInfo.reference;
    }).join('@@IMAGE_SEPARATOR@@');
    document.getElementById('imageReferencesStr').value = references;
}

// 处理粘贴事件
document.addEventListener('DOMContentLoaded', function() {
    var descriptionEl = document.getElementById('description');
    if (descriptionEl) {
        descriptionEl.addEventListener('paste', function(e) {
            var items = e.clipboardData.items;

            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    var file = items[i].getAsFile();
                    uploadImage(file);
                    break;
                }
            }
        });
    }
});

// 提交表单
function submitForm() {
    var form = document.getElementById('editForm');
    var formData = new FormData(form);
    var data = {};

    // 验证必填字段
    var title = formData.get('title').trim();
    var priority = formData.get('priority');
    var status = formData.get('status');
    var productType = formData.get('product_type_level1');
    var productSubType = formData.get('product_type_level2');
    var description = formData.get('description').trim();
    var imageReferences = document.getElementById('imageReferencesStr').value;

    if (!title) {
        showToast('请输入建议标题', 'error');
        return;
    }
    if (!priority) {
        showToast('请选择优先级', 'error');
        return;
    }
    if (!status) {
        showToast('请选择状态', 'error');
        return;
    }
    if (!productType) {
        showToast('请选择产品类型', 'error');
        return;
    }
    if (!productSubType) {
        showToast('请选择产品二级分类', 'error');
        return;
    }
    if (!description) {
        showToast('请输入详细描述', 'error');
        return;
    }

    // 组装数据
    formData.forEach(function(value, key) {
        if (key !== 'image_references_str') {
            data[key] = value;
        }
    });

    // 处理描述字段，包含图片引用
    if (imageReferences) {
        data.description = description + '\n' + imageReferences;
    } else {
        data.description = description;
    }

    // 显示加载状态
    showLoading('保存中...');

    fetch('/system/product_suggestion/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(res) {
        hideLoading();
        if (res.success) {
            showToast('修改成功', 'success');
            setTimeout(function() {
                window.location.href = '/system/product_suggestion/?mobile=1';
            }, 1000);
        } else {
            showToast(res.msg || '修改失败', 'error');
        }
    })
    .catch(function(err) {
        hideLoading();
        console.error('提交失败:', err);
        showToast('提交失败，请重试', 'error');
    });
}

// 导航函数已移至 common.js

// 显示加载提示
function showLoading(text) {
    var loading = document.getElementById('loadingToast');
    if (loading) {
        loading.querySelector('.loading-text').textContent = text || '加载中...';
        loading.classList.add('active');
    }
}

// 隐藏加载提示
function hideLoading() {
    var loading = document.getElementById('loadingToast');
    if (loading) {
        loading.classList.remove('active');
    }
}

// 显示Toast提示
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
