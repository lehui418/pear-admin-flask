layui.use(['jquery', 'layer'], function ($) {
    var basePath = '/';

    // 处理图片引用 - 与编辑模式保持一致，但图片不可编辑
    function processImageReferences() {
        var descriptionContent = $('#description-content').html();

        // 清除图片容器中的现有内容
        $('#description-image-container').empty();

        // 查找图片引用标记 ![图片](url#id=photoId) - 使用更健壮的正则表达式
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
        var cleanContent = descriptionContent.replace(imageRegex, '').replace(/@@IMAGE_SEPARATOR@@/g, '').trim();

        // 更新描述内容（不包含图片）
        $('#description-content').html(cleanContent);

        // 如果有图片，创建图片显示
        if (matches.length > 0) {
            var imageContainerHtml = '';

            matches.forEach(function (imageInfo) {
                var displayUrl = IMAGE_VIEW_URL + imageInfo.photoId;
                imageContainerHtml += '<div class="pasted-image" style="display:inline-block; position:relative; margin:5px;">' +
                    '<img src="' + displayUrl + '" style="max-width:200px; max-height:200px; border:1px solid #ddd; padding:3px; cursor:pointer;" alt="图片" data-id="' + imageInfo.photoId + '">' +
                    '</div>';
            });

            $('#description-image-container').html(imageContainerHtml);

            // 添加图片点击放大功能（查看模式下图片不可编辑）
            $('#description-image-container').on('click', 'img', function () {
                var imgUrl = $(this).attr('src');
                var imgId = $(this).attr('data-id') || '';

                // 使用Layui的layer组件创建图片预览弹窗
                if (typeof layer !== 'undefined') {
                    // 创建图片对象获取原始尺寸
                    var img = new Image();
                    img.onload = function () {
                        var imgWidth = this.width;
                        var imgHeight = this.height;
                        var maxWidth = window.innerWidth * 0.9; // 90% 窗口宽度
                        var maxHeight = window.innerHeight * 0.9; // 90% 窗口高度

                        // 计算适应尺寸
                        var width = imgWidth;
                        var height = imgHeight;

                        if (imgWidth > maxWidth) {
                            width = maxWidth;
                            height = (maxWidth / imgWidth) * imgHeight;
                        }

                        if (height > maxHeight) {
                            height = maxHeight;
                            width = (maxHeight / imgHeight) * imgWidth;
                        }

                        layer.open({
                            type: 1,
                            title: '图片预览',
                            closeBtn: 1,
                            area: [width + 'px', height + 'px'],
                            shadeClose: true,
                            maxmin: true, // 允许最大化
                            resize: true, // 允许调整大小
                            content: '<div style="text-align: center; padding: 10px; height: 100%; overflow: hidden;"><img src="' + imgUrl + '" style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block; margin: 0 auto;"></div>'
                        });
                    };
                    img.src = imgUrl;
                } else {
                    // 如果layer未加载，使用简单的window.open
                    window.open(imgUrl, '_blank');
                }
            });
        }
    }

    // 页面加载完成后处理图片
    $(document).ready(function () {
        processImageReferences();
    });
});