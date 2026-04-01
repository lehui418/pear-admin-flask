/**
 * 移动端产品建议新增功能
 * 文件路径: static/js/mobile/product-suggestion-add.js
 */

// 选择图片
function selectImage() {
    document.getElementById('imageInput').click();
}

// 处理图片选择
function handleImageSelect(event) {
    var files = event.target.files;
    var gallery = document.getElementById('imageGallery');

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();

        reader.onload = function(e) {
            var img = document.createElement('img');
            img.src = e.target.result;
            gallery.appendChild(img);
        };

        reader.readAsDataURL(file);
    }
}

// 返回
function goBack() {
    if (confirm('确定要取消吗？未保存的内容将丢失。')) {
        history.back();
    }
}

// 提交表单
function submitForm() {
    var form = document.getElementById('addForm');
    var formData = new FormData(form);

    // 验证必填项
    var title = formData.get('title');
    var priority = formData.get('priority');
    var status = formData.get('status');
    var productType = formData.get('product_type_level1');
    var productSubType = formData.get('product_type_level2');
    var description = formData.get('description');

    if (!title || !priority || !status || !productType || !productSubType || !description) {
        showToast('请填写所有必填项', 'error');
        return;
    }

    // 构建提交数据
    var data = {
        title: title,
        priority: priority,
        status: status,
        product_type_level1: productType,
        product_type_level2: productSubType,
        description: description,
        image_references_str: document.getElementById('imageReferencesStr').value
    };

    // 显示加载状态
    showLoading('提交中...');

    // 提交数据
    fetch('/system/product_suggestion/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        hideLoading();
        if (result.code === 0 || result.success) {
            showToast('提交成功', 'success');
            setTimeout(function() {
                window.location.href = '/system/product_suggestion/?mobile=1';
            }, 1000);
        } else {
            showToast(result.msg || '提交失败', 'error');
        }
    })
    .catch(err => {
        hideLoading();
        console.error('提交失败:', err);
        showToast('提交失败，请稍后重试', 'error');
    });
}

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

// 导航函数已移至 common.js
