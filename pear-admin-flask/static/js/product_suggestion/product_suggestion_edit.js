layui.use(['form', 'jquery', 'layer', 'upload'], function (form, $, layer, upload) {
    var basePath = '/';
    var imageUrls = [];

    // 检查是否有权限编辑（使用全局变量）
    if (NO_PERMISSION) {
        layer.msg(PERMISSION_MSG, { icon: 2, time: 2000 }, function () {
            // 关闭当前弹窗
            parent.layer.close(parent.layer.getFrameIndex(window.name));
        });
        // 禁用表单提交
        $('#editForm').find('input, select, textarea, button').prop('disabled', true);
    }

    // 初始化表单元素，确保按钮样式正确渲染
    form.render(null, 'editForm');

    // 从现有描述中提取图片引用
    function extractExistingImages() {
        var description = $('#description').val();
        // 修改正则表达式，使其更健壮地匹配图片引用，支持不同的图片格式和id格式
        var imageRegex = /!\[图片\]\(([^#]+)#id=([^)]+)\)/g;
        var match;

        // 清空现有图片数组
        imageUrls = [];

        while ((match = imageRegex.exec(description)) !== null) {
            var imageUrl = match[1];
            var photoId = match[2];
            imageUrls.push({
                url: imageUrl,
                id: photoId,
                reference: match[0]
            });
        }

        // 显示现有图片
        displayExistingImages();
        // 更新隐藏字段
        updateImageReferences();
    }

    // 显示现有图片
    function displayExistingImages() {
        var container = $('#description-image-container');
        container.empty();

        $.each(imageUrls, function (index, imageInfo) {
            var displayUrl = IMAGE_VIEW_URL_PREFIX + imageInfo.id;
            var imageDiv = $('<div class="pasted-image" style="display:inline-block; position:relative; margin:5px;">' +
                '<img src="' + displayUrl + '" style="max-width:200px; max-height:200px; border:1px solid #ddd; padding:3px; cursor:pointer;" alt="图片" data-id="' + imageInfo.id + '">' +
                '<button type="button" class="remove-image" data-index="' + index + '" style="position:absolute; top:-5px; right:-5px; background:#ff4444; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:12px;">×</button>' +
                '</div>');
            container.append(imageDiv);
        });
       
    }

    // 添加图片点击放大功能 - 使用事件委托确保动态创建的图片也能触发点击事件
    $('#description-image-container').off('click', '.pasted-image img').on('click', '.pasted-image img', function () {
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

    // 处理粘贴事件
    $('#description').on('paste', function (e) {
        var items = e.originalEvent.clipboardData.items;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                var file = item.getAsFile();

                var formData = new FormData();
                formData.append('file', file);

                // 显示上传状态
                var loading = layer.load(2, { shade: [0.3, '#000'] });

                $.ajax({
                    url: UPLOAD_IMAGE_URL,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        layer.close(loading);
                        if (response.success) {
                            var imageUrl = response.data.url;
                            var photoId = response.data.photo_id;

                            // 添加到图片数组
                            var imageReference = '!\[图片\](' + imageUrl + '#id=' + photoId + ')';
                            imageUrls.push({
                                url: imageUrl,
                                id: photoId,
                                reference: imageReference
                            });

                            // 显示图片
                            displayExistingImages();

                            // 更新隐藏字段
                            updateImageReferences();

                            layer.msg('图片上传成功', { icon: 1 });
                        } else {
                            layer.msg('图片上传失败: ' + response.message, { icon: 2 });
                        }
                    },
                    error: function () {
                        layer.close(loading);
                        layer.msg('图片上传失败', { icon: 2 });
                    }
                });

                break; // 只处理第一个图片
            }
        }
    });

    // 删除图片
    $('#description-image-container').on('click', '.remove-image', function () {
        var index = $(this).data('index');
        imageUrls.splice(index, 1);
        displayExistingImages();
        updateImageReferences();
    });

    // 更新图片引用隐藏字段
    function updateImageReferences() {
        var references = imageUrls.map(function (imageInfo) {
            return imageInfo.reference;
        }).join('@@IMAGE_SEPARATOR@@');
        $('#image_references_str').val(references);
    }

    // 绑定表单提交事件
    form.on('submit(editForm)', function (data) {
        var loadingIndex = layer.load();

        // 禁用提交按钮，防止重复提交
        var submitBtn = $(this);
        submitBtn.prop('disabled', true).addClass('layui-btn-disabled');

        // 更新描述字段，包含图片引用
        var description = $('#description').val();
        var imageReferences = $('#image_references_str').val();

        // 清除原始描述中的图片引用标记
        var cleanDescription = description.replace(/!\[图片\]\([^#]+#id=\d+\)/g, '').replace(/@@IMAGE_SEPARATOR@@/g, '').trim();

        if (imageReferences) {
            data.field.description = cleanDescription + '\n' + imageReferences;
        } else {
            data.field.description = cleanDescription;
        }

        $.ajax({
            url: UPDATE_URL,
            type: 'POST',
            data: JSON.stringify(data.field),
            contentType: 'application/json',
            dataType: 'json',
            success: function (res) {
                layer.close(loadingIndex);
                console.log('响应数据:', res);
                if (res.success === true) {
                    layer.msg(res.msg, { icon: 1 });
                    // 延迟执行，确保数据提交完成
                    setTimeout(function () {
                        // 先关闭当前弹窗
                        parent.layer.close(parent.layer.getFrameIndex(window.name));
                        // 然后刷新父页面的表格
                        if (parent.layui && parent.layui.table) {
                            parent.layui.table.reload('suggestionTable', {
                                url: '/system/product_suggestion/table',
                                where: { t: new Date().getTime() }, // 添加时间戳防止缓存
                                page: {
                                    curr: 1 // 重新从第 1 页开始
                                }
                            });
                        }
                    }, 500);
                } else {
                    layer.msg(res.msg, { icon: 2 });
                    // 恢复提交按钮
                    submitBtn.prop('disabled', false).removeClass('layui-btn-disabled');
                }
            },
            error: function (xhr, status, error) {
                layer.close(loadingIndex);
                console.log('请求错误:', status, error);
                console.log('响应内容:', xhr.responseText);
                layer.msg('请求失败，请稍后重试', { icon: 2 });
                // 恢复提交按钮
                submitBtn.prop('disabled', false).removeClass('layui-btn-disabled');
            }
        });
        return false; // 阻止表单默认提交
    });

    // 清理文本内容中的图片引用标记
    function cleanTextareaContent() {
        var description = $('#description').val();
        // 移除图片引用标记 ![图片](url#id=photoId)
        var cleanDescription = description.replace(/!\[图片\]\([^#]+#id=\d+\)/g, '').trim();
        $('#description').val(cleanDescription);
    }

    // 页面加载完成后提取现有图片并清理文本内容
    extractExistingImages();
    cleanTextareaContent();
});
