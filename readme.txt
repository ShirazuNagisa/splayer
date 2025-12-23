=== SPlayer ===
Contributors: yourname
Tags: music, player, audio, playlist, floating, minimalist
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

== Description ==
SPlayer 是一个轻量、极简风格的 WordPress 前端音乐播放器插件。
特色：
* 折叠为圆形唱片（圆角），播放时旋转，静止时停止。
* 展开为透明磨砂玻璃小窗口（高透明度的 frosted glass 背景）。
* 后台图形化管理歌单（支持添加/删除歌曲 URL、封面、标题）。
* 支持播放模式：顺序、单曲循环、随机播放。
* 支持从 GitHub 仓库检查更新并下载安装（手动或自动）。
* UI 追求日系极简风格，圆角设计，非侵入式浮动窗口。
* 可在前端选择并切换歌曲、显示封面、显示播放进度与基本控制。

== Installation ==
1. 将插件目录 `splayer` 上传到 `/wp-content/plugins/` 目录。
2. 在 WordPress 后台插件页面启用 SPlayer。
3. 管理 -> SPlayer：在插件后台中添加歌曲（标题、URL、可选封面 URL）。

== Changelog ==
= 1.0.0 =
* 初始版本：实现播放器核心、后台歌单管理、前端播放、GitHub 更新检查安装功能、卸载清理。

== Frequently Asked Questions ==
Q：支持哪些音频格式？
A：浏览器支持的音频格式（常见 mp3, m4a, ogg 等）。播放取决于用户浏览器是否支持对应格式。

Q：如何设置 GitHub 自动更新？
A：在后台设置中填写 GitHub 仓库（例如 `yourname/splayer`），勾选自动更新并保存。插件会使用 GitHub latest release API（或 zipball）下载并覆盖插件文件。请务必确保仓库结构与插件根目录兼容。

Q：如何添加歌曲？
A：后台 -> SPlayer -> 添加歌曲。需要提供至少一个可以直接访问的音频 URL（跨域须允许），可选封面 URL。

Q：移除插件会删除我的歌单吗？
A：是的，卸载（delete）插件会删除保存在 `splayer_options` 的设置和歌单。如果你只停用插件则不会删除数据。

== Screenshots ==
1. 折叠为圆形唱片（浮动角落）
2. 展开为磨砂玻璃窗口，包含播放列表与控制
3. 后台歌单管理界面（添加 / 删除歌曲）

== Security & Notes ==
* 插件对后台操作做了能力检查（`manage_options`）及 nonce 校验。
* GitHub 更新会调用远程网络请求，请确保主机允许 outbound HTTPS 请求。
* 插件下载并覆盖文件有潜在风险。为保险起见，请在使用自动更新前备份站点文件与数据库。

== Developer Notes ==
* 前端脚本使用本地化数据（wp_localize_script）注入歌单与设置。
* 后台使用 WP_AJAX 接口和 WP_Filesystem 进行远程下载与写入。若目标站点运行在受限主机上，WP_Filesystem 可能需要 FTP/SSH 凭证。

== License ==
GPLv2 or later. See LICENSE file for details.