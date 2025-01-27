前端页面编写
========================

Pear Admin Flask 并没有实现前后端分离，因为存在部分页面的数据是直接通过模板渲染的方式直接渲染在 HTML 中的。但我们将展示给用户浏览器里的页面都称为前端。

公用模板文件
--------------------

项目使用 Flask 搭建，其所有模板文件均存放在 `templates` 文件夹中。公用模板文件保存在 `templates/system/common` ，分别是：

* header.html  --  头部包含文件，包含了后台页面通用的 css 文件
* footer.html  --  页脚包含文件，包含了后台页面通用的 js 文件

在写后台内嵌页面时，可以参考下面的模板：

.. code-block:: html

    <!DOCTYPE html>
    <html>
    <head>
        <title>这是标题</title>
        {% include 'system/common/header.html' %}  <!-- 组件式嵌入不需要这行 -->
        <!-- 这里可以包含其他文件 -->
    </head>

    <body class="pear-container">
    <!-- 正文内容 -->
    </body>

    {% include 'system/common/footer.html' %}  <!-- 组件式嵌入不需要这行 -->
    <script> // 你的脚本写这里 </script>
    </html>

.. note::

    需要注意的是，`header.html` 和 `footer.html` 包含了主题色和夜间模式切换的脚本，如果不想包含这两个文件的话，
    还想进行主题色和夜间模式切换可能需要自行添加脚本。（可以参考这两个文件中的内容）

正确的后台页面嵌入方式
-----------------------

Pear Admin Layui 主项目更新之后，提供了 组件式嵌入（_component） 和 iframe嵌入（_iframe） 两种方式。在编写前端页面时，
不同的嵌入方式有所不同，各有优劣。

对于组件式嵌入，可以提供更良好的用户体验，如果页面不存在则会弹出 404 提示信息，对于iframe嵌入，则会直接打开（即使不存在）。

.. important::
    **使用组件式嵌入时，上述的参考模板不在需要包含 header.html 和 footer.html 文件，如果包含这两个文件会直接影响到后台框架页面的排版和脚本调用！**

经过测试，组件式嵌入仅适合于唯一且静态的页面，不建议在其中 **添加事件绑定的脚本** ，因为组件式嵌入会将页面内容直接嵌入 div 元素中，
并动态执行脚本，但是执行的脚本绑定的事件并不会因为页面关闭而销毁。简单说明就是，假设脚本中存在计时器，计时器不会在组件式嵌入的页面销毁之后而销毁。

所以在 Pear Admin Flask 项目中，仅首页（后台数据统计页面）和个人资料页面使用组件式嵌入，其余均使用iframe嵌入。

关于主题色和夜间模式
-----------------------

如果开发的是后台管理页面，主题色和夜间模式是必要的，这样可以增加观感。
Pear Admin Layui 的控制主题色逻辑是通过设置全局的 css 属性：`--global-primary-color`

比如对于 `.layui-btn` ：

.. code-block:: css

    .layui-btn {
        background-color: var(--global-primary-color);
    }

所以，如果您添加了自定义元素，并想要其跟随主题色变化，请确保引用了 `--global-primary-color` 属性。

对于夜间模式，本质上就是修改 body 的 class ，使其添加上 `pear-admin-dark` ，比如 `.layui-btn` 的夜间模式 css 为：

.. code-block:: css

    .pear-admin-dark .layui-btn {
        color: #ffffff;
        border-color: #4C4D4F;
    }

