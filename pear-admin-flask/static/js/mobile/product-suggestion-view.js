/**
 * 移动端产品建议查看功能
 * 文件路径: static/js/mobile/product-suggestion-view.js
 */

// 图片查看URL前缀
var IMAGE_VIEW_URL = '/system/upload/image/';

// 返回
function goBack() {
    history.back();
}

// 处理图片引用
function processImageReferences() {
    var descriptionContent = document.querySelector('.description-content').innerHTML;
    var imageContainer = document.getElementById('descriptionImages');

    // 查找图片引用标记 ![图片](url#id=photoId)
    var imageRegex = /!\[图片\]\(([^#]+)#id=([^)]+)\)/g;
    var matches = [];
    var match;

    // 收集所有图片引用
    while ((match = imageRegex.exec(descriptionContent)) !== null) {
        matches.push({
            fullMatch: match[0],
            imageUrl: match[1],
            photoId: match[2]
        });
    }

    // 清除原始内容中的图片引用标记
    var cleanContent = descriptionContent.replace(imageRegex, '').trim();
    document.querySelector('.description-content').innerHTML = cleanContent || '暂无描述';

    // 如果有图片，创建图片显示
    if (matches.length > 0) {
        var html = '';
        matches.forEach(function(imageInfo) {
            var displayUrl = IMAGE_VIEW_URL + imageInfo.photoId;
            html += '<img src="' + displayUrl + '" alt="图片" onclick="openImageModal(this.src)">';
        });
        imageContainer.innerHTML = html;
    }
}

// 打开图片预览
function openImageModal(src) {
    var modal = document.getElementById('imageModal');
    var modalImg = document.getElementById('modalImage');
    modalImg.src = src;
    modal.classList.add('active');
}

// 关闭图片预览
function closeImageModal() {
    var modal = document.getElementById('imageModal');
    modal.classList.remove('active');
}

// 页面加载完成后处理图片
document.addEventListener('DOMContentLoaded', function() {
    processImageReferences();
});

// 导航函数已移至 common.js
