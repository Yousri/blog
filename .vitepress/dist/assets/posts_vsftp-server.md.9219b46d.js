import{_ as s,o as n,c as a,Q as l}from"./chunks/framework.be8d362c.js";const d=JSON.parse('{"title":"关于 FTP Server 一点基础常识","description":"最近日常处理客户及研发需求过程遇到的一些有关 ftp server 相关的问题时回补一些古老的 ftp 基础知识点；","frontmatter":{"date":"2024-05-29T00:00:00.000Z","title":"关于 FTP Server 一点基础常识","tags":["ftp","vsftpd","php"],"description":"最近日常处理客户及研发需求过程遇到的一些有关 ftp server 相关的问题时回补一些古老的 ftp 基础知识点；"},"headers":[],"relativePath":"posts/vsftp-server.md","filePath":"posts/vsftp-server.md"}'),p={name:"posts/vsftp-server.md"},o=l(`<h1 id="科普-ftp-server-基础-这里以基于-vsftpd-为例" tabindex="-1">科普 FTP Server 基础 （这里以基于 vsftpd 为例） <a class="header-anchor" href="#科普-ftp-server-基础-这里以基于-vsftpd-为例" aria-label="Permalink to &quot;科普 FTP Server 基础 （这里以基于 vsftpd 为例）&quot;">​</a></h1><h2 id="关于-ftp-的几种连接方式-连接会话" tabindex="-1">关于 <code>FTP</code> 的几种连接方式（<strong>连接会话</strong>） <a class="header-anchor" href="#关于-ftp-的几种连接方式-连接会话" aria-label="Permalink to &quot;关于 \`FTP\` 的几种连接方式（**连接会话**）&quot;">​</a></h2><ul><li><code>FTP</code> 普通方式<br> 协议 <code>ftp</code> ，默认端口 <code>21</code><br> 直连方式：<code>ftp://ftp.server.com</code></li><li><code>FTPS</code> 显式模式<br> 协议 <code>ftps</code> ，默认端口 <code>21</code>（连接其实类似 <code>FTP</code> 普通方式并没加密）<br> 直连方式： <code>ftps://ftp.server.com</code><br> 连接成功后再发送 <code>AUTH TLS</code> 或 <code>AUTH SSL</code> 命令才升级 <code>SSL/TLS</code> 连接方式；</li><li><code>FTPS</code> 隐式模式<br> 协议 <code>ftps</code> ，默认端口 <code>990</code> （从一开始就是建立加密的 <code>SSL/TLS</code> 连接，连接建立时即是加密的）<br> 服务端建议配置开启 <code>implicit_ssl=YES</code> 隐式模式<br> 直连方式：<code>ftps://ftp.server.com:990</code></li></ul><p><strong>注意事项</strong></p><ul><li>在标准配置中，就 <code>FTPS</code> 协议而言，显式 <code>FTPS</code> 通常默认使用端口 21，而隐式 <code>FTPS</code> 默认使用端口 990。所以端口 990 通常用于隐式 <code>FTPS</code>，显式 <code>FTPS</code> 通常使用端口 21，但也可以配置为使用其他端口。</li><li>显式 FTPS 在连接建立后通过命令升级到加密，而隐式 FTPS 从一开始就是加密的。</li><li>如果希望通过显式模式使用端口 990，可以进行配置，但这并不符合标准 <code>FTP</code> 规范，可能会导致客户端和服务器之间的兼容性问题。标准显式 <code>FTPS</code> 是在端口 21 上进行的。</li><li>经测试尝试使用显式模式连接到端口 990 的方法，从测试结果来看是服务器和客户端并不一定兼容支持这种非标准方式配置。</li><li>显式 <code>FTPS</code> 在非标准端口（如 990）上可能会导致一些客户端无法正确处理连接，因为他们期望在端口 990 上使用隐式 <code>FTPS</code> \`，所以最好使用标准端口 21 进行显式 FTPS。</li></ul><h2 id="关于-ftp-的数据传输模式-数据会话" tabindex="-1">关于 <code>FTP</code> 的数据传输模式（<strong>数据会话</strong>） <a class="header-anchor" href="#关于-ftp-的数据传输模式-数据会话" aria-label="Permalink to &quot;关于 \`FTP\` 的数据传输模式（**数据会话**）&quot;">​</a></h2><p>前面连接只是在建立连接的会话，建连完成后会有单独额外的数据传输会话；<br> FTP 数据传输模式主要有两种：主动模式（<code>Active Mode</code>）和被动模式（<code>Passive Mode</code>），这两种模式定义了数据传输过程中，客户端和服务器之间如何建立数据连接的。</p><ul><li>主动模式（<code>Active Mode</code>） 这种模式下，客户端在连接上（比如端口 21 ）会告知服务器在哪个端口上监听数据连接。服务器然后从它的默认数据端口（默认端口通常 20）连接到客户端指定的数据端口,数据链路大致： <ul><li>客户端在连接上发送 PORT 命令，会开启一个监听的数据端口</li><li>服务器从数据端口（默认端口通常 20）连接到客户端指定的端口</li></ul></li></ul><p>这种模式就依赖客户端必须开放一个端口并允许服务器连接，这在实际用户场景的 <code>NAT</code> 网络环境下显然不现实，所以基本不会使用这种方式；</p><ul><li>被动模式（<code>Passive Mode</code>） 服务器告诉客户端它在某个端口（这个默认是随机，服务端可配置，下面说明）上监听数据连接，客户端随后连接到服务器的这个端口。 <ul><li>客户端在命令连接上发送 <code>PASV</code> 命令</li><li>服务器响应并提供一个端口号，告诉客户端它在哪个端口上监听数据连接</li><li>客户端随后连接到服务器指定的端口</li></ul></li></ul><p>所以这里需要服务端新开启一个<strong>数据会话</strong> 用于传输数据的监听端口, 这个监听端口数据链路返回给客户端用户的 IP 默认可能是 服务端的 <code>私网IP</code> 导致访问不了，所以服务端 ftp 需要配置 <code>pasv_address= public ip</code>，客户端用户才可能传输；</p><h2 id="vsftpd配置示例及php测试示例" tabindex="-1"><code>vsftpd</code>配置示例及<code>PHP</code>测试示例 <a class="header-anchor" href="#vsftpd配置示例及php测试示例" aria-label="Permalink to &quot;\`vsftpd\`配置示例及\`PHP\`测试示例&quot;">​</a></h2><h3 id="服务端-vsftpd-配置示例参考" tabindex="-1">服务端 <code>vsftpd</code> 配置示例参考 <a class="header-anchor" href="#服务端-vsftpd-配置示例参考" aria-label="Permalink to &quot;服务端 \`vsftpd\` 配置示例参考&quot;">​</a></h3><div class="language-yaml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yaml</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#9ECBFF;">listen=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">listen_port=21</span></span>
<span class="line"><span style="color:#9ECBFF;">listen_ipv6=NO</span></span>
<span class="line"><span style="color:#9ECBFF;">anonymous_enable=NO</span></span>
<span class="line"><span style="color:#9ECBFF;">local_enable=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">write_enable=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">local_umask=022</span></span>
<span class="line"><span style="color:#9ECBFF;">dirmessage_enable=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">use_localtime=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">xferlog_enable=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">log_ftp_protocol=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">connect_from_port_20=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">chroot_local_user=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">chroot_list_enable=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">chroot_list_file=/etc/vsftpd.chroot_list</span></span>
<span class="line"><span style="color:#6A737D;"># 开启 ssl</span></span>
<span class="line"><span style="color:#9ECBFF;">ssl_enable=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">force_local_data_ssl=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">force_local_logins_ssl=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">ssl_tlsv1=YES</span></span>
<span class="line"><span style="color:#9ECBFF;">ssl_sslv2=NO</span></span>
<span class="line"><span style="color:#9ECBFF;">ssl_sslv3=NO</span></span>
<span class="line"><span style="color:#9ECBFF;">require_ssl_reuse=NO</span></span>
<span class="line"><span style="color:#9ECBFF;">ssl_ciphers=HIGH</span></span>
<span class="line"><span style="color:#9ECBFF;">rsa_cert_file=/etc/ssl/private/vsftpd.pem</span></span>
<span class="line"><span style="color:#9ECBFF;">rsa_private_key_file=/etc/ssl/private/vsftpd.pem</span></span>
<span class="line"><span style="color:#9ECBFF;">debug_ssl=YES</span></span>
<span class="line"><span style="color:#6A737D;"># 开启被动模式</span></span>
<span class="line"><span style="color:#9ECBFF;">pasv_enable=YES</span></span>
<span class="line"><span style="color:#6A737D;"># 指定被动模式的端口范围</span></span>
<span class="line"><span style="color:#9ECBFF;">pasv_min_port=10000</span></span>
<span class="line"><span style="color:#9ECBFF;">pasv_max_port=10100</span></span>
<span class="line"><span style="color:#6A737D;"># ftp server 公网 IP 地址，最好设置</span></span>
<span class="line"><span style="color:#9ECBFF;">pasv_address= public ip</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#032F62;">listen=YES</span></span>
<span class="line"><span style="color:#032F62;">listen_port=21</span></span>
<span class="line"><span style="color:#032F62;">listen_ipv6=NO</span></span>
<span class="line"><span style="color:#032F62;">anonymous_enable=NO</span></span>
<span class="line"><span style="color:#032F62;">local_enable=YES</span></span>
<span class="line"><span style="color:#032F62;">write_enable=YES</span></span>
<span class="line"><span style="color:#032F62;">local_umask=022</span></span>
<span class="line"><span style="color:#032F62;">dirmessage_enable=YES</span></span>
<span class="line"><span style="color:#032F62;">use_localtime=YES</span></span>
<span class="line"><span style="color:#032F62;">xferlog_enable=YES</span></span>
<span class="line"><span style="color:#032F62;">log_ftp_protocol=YES</span></span>
<span class="line"><span style="color:#032F62;">connect_from_port_20=YES</span></span>
<span class="line"><span style="color:#032F62;">chroot_local_user=YES</span></span>
<span class="line"><span style="color:#032F62;">chroot_list_enable=YES</span></span>
<span class="line"><span style="color:#032F62;">chroot_list_file=/etc/vsftpd.chroot_list</span></span>
<span class="line"><span style="color:#6A737D;"># 开启 ssl</span></span>
<span class="line"><span style="color:#032F62;">ssl_enable=YES</span></span>
<span class="line"><span style="color:#032F62;">force_local_data_ssl=YES</span></span>
<span class="line"><span style="color:#032F62;">force_local_logins_ssl=YES</span></span>
<span class="line"><span style="color:#032F62;">ssl_tlsv1=YES</span></span>
<span class="line"><span style="color:#032F62;">ssl_sslv2=NO</span></span>
<span class="line"><span style="color:#032F62;">ssl_sslv3=NO</span></span>
<span class="line"><span style="color:#032F62;">require_ssl_reuse=NO</span></span>
<span class="line"><span style="color:#032F62;">ssl_ciphers=HIGH</span></span>
<span class="line"><span style="color:#032F62;">rsa_cert_file=/etc/ssl/private/vsftpd.pem</span></span>
<span class="line"><span style="color:#032F62;">rsa_private_key_file=/etc/ssl/private/vsftpd.pem</span></span>
<span class="line"><span style="color:#032F62;">debug_ssl=YES</span></span>
<span class="line"><span style="color:#6A737D;"># 开启被动模式</span></span>
<span class="line"><span style="color:#032F62;">pasv_enable=YES</span></span>
<span class="line"><span style="color:#6A737D;"># 指定被动模式的端口范围</span></span>
<span class="line"><span style="color:#032F62;">pasv_min_port=10000</span></span>
<span class="line"><span style="color:#032F62;">pasv_max_port=10100</span></span>
<span class="line"><span style="color:#6A737D;"># ftp server 公网 IP 地址，最好设置</span></span>
<span class="line"><span style="color:#032F62;">pasv_address= public ip</span></span></code></pre></div><p>如果要强制使用 <code>隐式模式</code> 连接，那就微调如下配置：</p><div class="language-yaml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yaml</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#9ECBFF;">listen_port=990</span></span>
<span class="line"><span style="color:#9ECBFF;">implicit_ssl=YES</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#032F62;">listen_port=990</span></span>
<span class="line"><span style="color:#032F62;">implicit_ssl=YES</span></span></code></pre></div><p>BTW: 可以考虑使用两个位置文件 <code>vsftpd.conf</code> / <code>vsftpd_ssl.conf</code> 分别开启同时支持 <code>ftps</code> 协议方式的显式/隐式模式 <code>ftp</code> 服务</p><h3 id="php-测试示例" tabindex="-1"><code>PHP</code> 测试示例 <a class="header-anchor" href="#php-测试示例" aria-label="Permalink to &quot;\`PHP\` 测试示例&quot;">​</a></h3><h4 id="借助-curl-方式" tabindex="-1">借助 <code>cURL</code> 方式 <a class="header-anchor" href="#借助-curl-方式" aria-label="Permalink to &quot;借助 \`cURL\` 方式&quot;">​</a></h4><div class="language-php vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">php</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#6A737D;">// FTP 服务器信息</span></span>
<span class="line"><span style="color:#E1E4E8;">$ftp_server </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;ftp.server.com&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">$ftp_port </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">21</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#6A737D;">#$ftp_port = 990;</span></span>
<span class="line"><span style="color:#E1E4E8;">$ftp_username </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;ftpuser&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">$ftp_password </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;ftpuser&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">$local_file </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;./me.jpg&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">$remote_file </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;/home/ftp/me.jpg&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#6A737D;">// 初始化 curl</span></span>
<span class="line"><span style="color:#E1E4E8;">$ch </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">curl_init</span><span style="color:#E1E4E8;">();</span></span>
<span class="line"><span style="color:#6A737D;">// 设置 curl 选项</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_URL</span><span style="color:#E1E4E8;">, </span><span style="color:#9ECBFF;">&quot;ftp://</span><span style="color:#E1E4E8;">$ftp_server</span><span style="color:#9ECBFF;">:</span><span style="color:#E1E4E8;">$ftp_port</span><span style="color:#9ECBFF;">/</span><span style="color:#E1E4E8;">$remote_file</span><span style="color:#9ECBFF;">&quot;</span><span style="color:#E1E4E8;">); </span><span style="color:#6A737D;"># 普通 ftp 协议</span></span>
<span class="line"><span style="color:#6A737D;">#curl_setopt($ch, CURLOPT_URL, &quot;ftps://$ftp_server:$ftp_port/$remote_file&quot;); # ftp over ssl 的 ftps 协议</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_USERPWD</span><span style="color:#E1E4E8;">, </span><span style="color:#9ECBFF;">&quot;</span><span style="color:#E1E4E8;">$ftp_username</span><span style="color:#9ECBFF;">:</span><span style="color:#E1E4E8;">$ftp_password</span><span style="color:#9ECBFF;">&quot;</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_UPLOAD</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">1</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_FTP_SSL</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">CURLFTPSSL_ALL</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_FTPSSLAUTH</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">CURLFTPAUTH_SSL</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_INFILE</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">fopen</span><span style="color:#E1E4E8;">($local_file, </span><span style="color:#9ECBFF;">&#39;r&#39;</span><span style="color:#E1E4E8;">));</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_INFILESIZE</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">filesize</span><span style="color:#E1E4E8;">($local_file));</span></span>
<span class="line"><span style="color:#6A737D;">// 禁用 SSL 证书验证</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_SSL_VERIFYPEER</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">false</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_SSL_VERIFYHOST</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">false</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 使用被动模式</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_FTP_USE_EPSV</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">true</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 指定使用 TLSv1.2</span></span>
<span class="line"><span style="color:#79B8FF;">curl_setopt</span><span style="color:#E1E4E8;">($ch, </span><span style="color:#79B8FF;">CURLOPT_SSLVERSION</span><span style="color:#E1E4E8;">, </span><span style="color:#79B8FF;">CURL_SSLVERSION_TLSv1_2</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 执行上传</span></span>
<span class="line"><span style="color:#E1E4E8;">$result </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">curl_exec</span><span style="color:#E1E4E8;">($ch);</span></span>
<span class="line"><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> ($result </span><span style="color:#F97583;">!==</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">false</span><span style="color:#E1E4E8;">) {</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#79B8FF;">echo</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;File uploaded successfully using TLSv1.2</span><span style="color:#79B8FF;">\\n</span><span style="color:#9ECBFF;">&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">} </span><span style="color:#F97583;">else</span><span style="color:#E1E4E8;"> {</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#79B8FF;">echo</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;Curl error: &quot;</span><span style="color:#E1E4E8;"> </span><span style="color:#F97583;">.</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">curl_error</span><span style="color:#E1E4E8;">($ch) </span><span style="color:#F97583;">.</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;</span><span style="color:#79B8FF;">\\n</span><span style="color:#9ECBFF;">&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">}</span></span>
<span class="line"><span style="color:#6A737D;">// 关闭 curl</span></span>
<span class="line"><span style="color:#79B8FF;">curl_close</span><span style="color:#E1E4E8;">($ch);</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#6A737D;">// FTP 服务器信息</span></span>
<span class="line"><span style="color:#24292E;">$ftp_server </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;ftp.server.com&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">$ftp_port </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">21</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#6A737D;">#$ftp_port = 990;</span></span>
<span class="line"><span style="color:#24292E;">$ftp_username </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;ftpuser&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">$ftp_password </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;ftpuser&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">$local_file </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;./me.jpg&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">$remote_file </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;/home/ftp/me.jpg&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#6A737D;">// 初始化 curl</span></span>
<span class="line"><span style="color:#24292E;">$ch </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">curl_init</span><span style="color:#24292E;">();</span></span>
<span class="line"><span style="color:#6A737D;">// 设置 curl 选项</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_URL</span><span style="color:#24292E;">, </span><span style="color:#032F62;">&quot;ftp://</span><span style="color:#24292E;">$ftp_server</span><span style="color:#032F62;">:</span><span style="color:#24292E;">$ftp_port</span><span style="color:#032F62;">/</span><span style="color:#24292E;">$remote_file</span><span style="color:#032F62;">&quot;</span><span style="color:#24292E;">); </span><span style="color:#6A737D;"># 普通 ftp 协议</span></span>
<span class="line"><span style="color:#6A737D;">#curl_setopt($ch, CURLOPT_URL, &quot;ftps://$ftp_server:$ftp_port/$remote_file&quot;); # ftp over ssl 的 ftps 协议</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_USERPWD</span><span style="color:#24292E;">, </span><span style="color:#032F62;">&quot;</span><span style="color:#24292E;">$ftp_username</span><span style="color:#032F62;">:</span><span style="color:#24292E;">$ftp_password</span><span style="color:#032F62;">&quot;</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_UPLOAD</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">1</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_FTP_SSL</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">CURLFTPSSL_ALL</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_FTPSSLAUTH</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">CURLFTPAUTH_SSL</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_INFILE</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">fopen</span><span style="color:#24292E;">($local_file, </span><span style="color:#032F62;">&#39;r&#39;</span><span style="color:#24292E;">));</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_INFILESIZE</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">filesize</span><span style="color:#24292E;">($local_file));</span></span>
<span class="line"><span style="color:#6A737D;">// 禁用 SSL 证书验证</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_SSL_VERIFYPEER</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">false</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_SSL_VERIFYHOST</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">false</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 使用被动模式</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_FTP_USE_EPSV</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">true</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 指定使用 TLSv1.2</span></span>
<span class="line"><span style="color:#005CC5;">curl_setopt</span><span style="color:#24292E;">($ch, </span><span style="color:#005CC5;">CURLOPT_SSLVERSION</span><span style="color:#24292E;">, </span><span style="color:#005CC5;">CURL_SSLVERSION_TLSv1_2</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 执行上传</span></span>
<span class="line"><span style="color:#24292E;">$result </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">curl_exec</span><span style="color:#24292E;">($ch);</span></span>
<span class="line"><span style="color:#D73A49;">if</span><span style="color:#24292E;"> ($result </span><span style="color:#D73A49;">!==</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">false</span><span style="color:#24292E;">) {</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#005CC5;">echo</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;File uploaded successfully using TLSv1.2</span><span style="color:#005CC5;">\\n</span><span style="color:#032F62;">&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">} </span><span style="color:#D73A49;">else</span><span style="color:#24292E;"> {</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#005CC5;">echo</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;Curl error: &quot;</span><span style="color:#24292E;"> </span><span style="color:#D73A49;">.</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">curl_error</span><span style="color:#24292E;">($ch) </span><span style="color:#D73A49;">.</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;</span><span style="color:#005CC5;">\\n</span><span style="color:#032F62;">&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">}</span></span>
<span class="line"><span style="color:#6A737D;">// 关闭 curl</span></span>
<span class="line"><span style="color:#005CC5;">curl_close</span><span style="color:#24292E;">($ch);</span></span></code></pre></div><h4 id="默认的-ftp函数方式" tabindex="-1">默认的 <code>FTP</code>函数方式 <a class="header-anchor" href="#默认的-ftp函数方式" aria-label="Permalink to &quot;默认的 \`FTP\`函数方式&quot;">​</a></h4><div class="language-php vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">php</span><pre class="shiki github-dark vp-code-dark"><code><span class="line"><span style="color:#E1E4E8;">$ftp_server </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;ftp.server.com&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">$ftp_username </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;ftpuser&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">$ftp_password </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;ftpuser&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">$remote_file </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;/home/ftp/me.jpg&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#E1E4E8;">$local_file </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;./me.jpg&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#6A737D;">// 使用 ftp_ssl_connect 连接到 FTP 服务器</span></span>
<span class="line"><span style="color:#E1E4E8;">$conn_id </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">ftp_ssl_connect</span><span style="color:#E1E4E8;">($ftp_server);</span></span>
<span class="line"><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> (</span><span style="color:#F97583;">!</span><span style="color:#E1E4E8;">$conn_id) {</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">die</span><span style="color:#E1E4E8;">(</span><span style="color:#9ECBFF;">&quot;Couldn&#39;t connect to FTP server&quot;</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#E1E4E8;">}</span></span>
<span class="line"><span style="color:#6A737D;">// 使用用户名和密码登录</span></span>
<span class="line"><span style="color:#E1E4E8;">$login_result </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">ftp_login</span><span style="color:#E1E4E8;">($conn_id, $ftp_username, $ftp_password);</span></span>
<span class="line"><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> (</span><span style="color:#F97583;">!</span><span style="color:#E1E4E8;">$login_result) {</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#79B8FF;">ftp_close</span><span style="color:#E1E4E8;">($conn_id);</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">die</span><span style="color:#E1E4E8;">(</span><span style="color:#9ECBFF;">&quot;Couldn&#39;t login to FTP server&quot;</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#E1E4E8;">}</span></span>
<span class="line"><span style="color:#6A737D;">// 设置被动模式</span></span>
<span class="line"><span style="color:#79B8FF;">ftp_pasv</span><span style="color:#E1E4E8;">($conn_id, </span><span style="color:#79B8FF;">true</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 打开本地文件以读取内容</span></span>
<span class="line"><span style="color:#E1E4E8;">$file </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">fopen</span><span style="color:#E1E4E8;">($local_file, </span><span style="color:#9ECBFF;">&#39;r&#39;</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> (</span><span style="color:#F97583;">!</span><span style="color:#E1E4E8;">$file) {</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#79B8FF;">ftp_close</span><span style="color:#E1E4E8;">($conn_id);</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">die</span><span style="color:#E1E4E8;">(</span><span style="color:#9ECBFF;">&quot;Couldn&#39;t open local file&quot;</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#E1E4E8;">}</span></span>
<span class="line"><span style="color:#6A737D;">// 将本地文件上传到远程服务器</span></span>
<span class="line"><span style="color:#E1E4E8;">$upload_result </span><span style="color:#F97583;">=</span><span style="color:#E1E4E8;"> </span><span style="color:#79B8FF;">ftp_fput</span><span style="color:#E1E4E8;">($conn_id, $remote_file, $file, </span><span style="color:#79B8FF;">FTP_BINARY</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 关闭本地文件</span></span>
<span class="line"><span style="color:#79B8FF;">fclose</span><span style="color:#E1E4E8;">($file);</span></span>
<span class="line"><span style="color:#F97583;">if</span><span style="color:#E1E4E8;"> (</span><span style="color:#F97583;">!</span><span style="color:#E1E4E8;">$upload_result) {</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#79B8FF;">ftp_close</span><span style="color:#E1E4E8;">($conn_id);</span></span>
<span class="line"><span style="color:#E1E4E8;">    </span><span style="color:#F97583;">die</span><span style="color:#E1E4E8;">(</span><span style="color:#9ECBFF;">&quot;Failed to upload file&quot;</span><span style="color:#E1E4E8;">);</span></span>
<span class="line"><span style="color:#E1E4E8;">}</span></span>
<span class="line"><span style="color:#79B8FF;">echo</span><span style="color:#E1E4E8;"> </span><span style="color:#9ECBFF;">&quot;File uploaded successfully</span><span style="color:#79B8FF;">\\n</span><span style="color:#9ECBFF;">&quot;</span><span style="color:#E1E4E8;">;</span></span>
<span class="line"><span style="color:#6A737D;">// 关闭连接</span></span>
<span class="line"><span style="color:#79B8FF;">ftp_close</span><span style="color:#E1E4E8;">($conn_id);</span></span></code></pre><pre class="shiki github-light vp-code-light"><code><span class="line"><span style="color:#24292E;">$ftp_server </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;ftp.server.com&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">$ftp_username </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;ftpuser&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">$ftp_password </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;ftpuser&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">$remote_file </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;/home/ftp/me.jpg&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#24292E;">$local_file </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;./me.jpg&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#6A737D;">// 使用 ftp_ssl_connect 连接到 FTP 服务器</span></span>
<span class="line"><span style="color:#24292E;">$conn_id </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">ftp_ssl_connect</span><span style="color:#24292E;">($ftp_server);</span></span>
<span class="line"><span style="color:#D73A49;">if</span><span style="color:#24292E;"> (</span><span style="color:#D73A49;">!</span><span style="color:#24292E;">$conn_id) {</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">die</span><span style="color:#24292E;">(</span><span style="color:#032F62;">&quot;Couldn&#39;t connect to FTP server&quot;</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#24292E;">}</span></span>
<span class="line"><span style="color:#6A737D;">// 使用用户名和密码登录</span></span>
<span class="line"><span style="color:#24292E;">$login_result </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">ftp_login</span><span style="color:#24292E;">($conn_id, $ftp_username, $ftp_password);</span></span>
<span class="line"><span style="color:#D73A49;">if</span><span style="color:#24292E;"> (</span><span style="color:#D73A49;">!</span><span style="color:#24292E;">$login_result) {</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#005CC5;">ftp_close</span><span style="color:#24292E;">($conn_id);</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">die</span><span style="color:#24292E;">(</span><span style="color:#032F62;">&quot;Couldn&#39;t login to FTP server&quot;</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#24292E;">}</span></span>
<span class="line"><span style="color:#6A737D;">// 设置被动模式</span></span>
<span class="line"><span style="color:#005CC5;">ftp_pasv</span><span style="color:#24292E;">($conn_id, </span><span style="color:#005CC5;">true</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 打开本地文件以读取内容</span></span>
<span class="line"><span style="color:#24292E;">$file </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">fopen</span><span style="color:#24292E;">($local_file, </span><span style="color:#032F62;">&#39;r&#39;</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#D73A49;">if</span><span style="color:#24292E;"> (</span><span style="color:#D73A49;">!</span><span style="color:#24292E;">$file) {</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#005CC5;">ftp_close</span><span style="color:#24292E;">($conn_id);</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">die</span><span style="color:#24292E;">(</span><span style="color:#032F62;">&quot;Couldn&#39;t open local file&quot;</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#24292E;">}</span></span>
<span class="line"><span style="color:#6A737D;">// 将本地文件上传到远程服务器</span></span>
<span class="line"><span style="color:#24292E;">$upload_result </span><span style="color:#D73A49;">=</span><span style="color:#24292E;"> </span><span style="color:#005CC5;">ftp_fput</span><span style="color:#24292E;">($conn_id, $remote_file, $file, </span><span style="color:#005CC5;">FTP_BINARY</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#6A737D;">// 关闭本地文件</span></span>
<span class="line"><span style="color:#005CC5;">fclose</span><span style="color:#24292E;">($file);</span></span>
<span class="line"><span style="color:#D73A49;">if</span><span style="color:#24292E;"> (</span><span style="color:#D73A49;">!</span><span style="color:#24292E;">$upload_result) {</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#005CC5;">ftp_close</span><span style="color:#24292E;">($conn_id);</span></span>
<span class="line"><span style="color:#24292E;">    </span><span style="color:#D73A49;">die</span><span style="color:#24292E;">(</span><span style="color:#032F62;">&quot;Failed to upload file&quot;</span><span style="color:#24292E;">);</span></span>
<span class="line"><span style="color:#24292E;">}</span></span>
<span class="line"><span style="color:#005CC5;">echo</span><span style="color:#24292E;"> </span><span style="color:#032F62;">&quot;File uploaded successfully</span><span style="color:#005CC5;">\\n</span><span style="color:#032F62;">&quot;</span><span style="color:#24292E;">;</span></span>
<span class="line"><span style="color:#6A737D;">// 关闭连接</span></span>
<span class="line"><span style="color:#005CC5;">ftp_close</span><span style="color:#24292E;">($conn_id);</span></span></code></pre></div>`,22),e=[o];function c(t,r,E,y,i,F){return n(),a("div",null,e)}const u=s(p,[["render",c]]);export{d as __pageData,u as default};
