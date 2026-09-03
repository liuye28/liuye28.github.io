import React, { useState, useMemo } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import './ToolsCommon.css';

const SAMPLE_CURL = `curl 'https://api.example.com/v1/orders' \\
  -X POST \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' \\
  -H 'Content-Type: application/json' \\
  -d '{"order_id": 10086, "status": "PAID"}'`;

/**
 * 解析 cURL 命令行
 */
function parseCurl(curlCommand) {
  if (!curlCommand) return null;

  // 清洗换行连接符 \
  const cleaned = curlCommand.replace(/\\\r?\n/g, ' ').trim();
  if (!cleaned.startsWith('curl')) return null;

  let method = 'GET';
  let url = '';
  const headers = {};
  let body = '';

  // 匹配 URL: 第一个非 flag 的 http 字符串
  const urlMatch = cleaned.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/i);
  if (urlMatch) {
    url = urlMatch[1];
  }

  // 匹配 Method
  const methodMatch = cleaned.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i);
  if (methodMatch) {
    method = methodMatch[1].toUpperCase();
  }

  // 匹配 Headers: -H "Key: Value" 或 --header 'Key: Value'
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/gi;
  let hMatch;
  while ((hMatch = headerRegex.exec(cleaned)) !== null) {
    const rawHeader = hMatch[1];
    const colonIdx = rawHeader.indexOf(':');
    if (colonIdx > 0) {
      const key = rawHeader.substring(0, colonIdx).trim();
      const val = rawHeader.substring(colonIdx + 1).trim();
      headers[key] = val;
    }
  }

  // 匹配 Body: -d '...', --data '...', --data-raw '...'
  const dataRegex = /(?:-d|--data|--data-raw)\s+['"]([\s\S]*?)['"](?:\s|$)/i;
  const dataMatch = cleaned.match(dataRegex);
  if (dataMatch) {
    body = dataMatch[1];
    if (method === 'GET' && !methodMatch) {
      method = 'POST'; // 带 body 且未显式指定 method 时默认为 POST
    }
  }

  return { method, url, headers, body };
}

/**
 * 生成各目标语言的代码
 */
function generateCode(parsed, target) {
  if (!parsed || !parsed.url) {
    return '// 请输入合法的 cURL 命令';
  }

  const { method, url, headers, body } = parsed;

  if (target === 'java11') {
    // Java 11+ HttpClient
    const lines = [];
    lines.push('import java.net.URI;');
    lines.push('import java.net.http.HttpClient;');
    lines.push('import java.net.http.HttpRequest;');
    lines.push('import java.net.http.HttpResponse;');
    lines.push('import java.time.Duration;');
    lines.push('');
    lines.push('public class HttpClientExample {');
    lines.push('    public static void main(String[] args) throws Exception {');
    lines.push('        HttpClient client = HttpClient.newBuilder()');
    lines.push('                .connectTimeout(Duration.ofSeconds(10))');
    lines.push('                .build();');
    lines.push('');
    lines.push('        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()');
    lines.push(`                .uri(URI.create("${url}"))`);
    lines.push('                .timeout(Duration.ofSeconds(15))');

    for (const [k, v] of Object.entries(headers)) {
      lines.push(`                .header("${k}", "${v.replace(/"/g, '\\"')}")`);
    }

    if (body) {
      lines.push(`                .method("${method}", HttpRequest.BodyPublishers.ofString("${body.replace(/"/g, '\\"')}"));`);
    } else {
      if (method === 'GET') {
        lines.push('                .GET();');
      } else {
        lines.push(`                .method("${method}", HttpRequest.BodyPublishers.noBody());`);
      }
    }

    lines.push('');
    lines.push('        HttpRequest request = requestBuilder.build();');
    lines.push('        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());');
    lines.push('');
    lines.push('        System.out.println("Status Code: " + response.statusCode());');
    lines.push('        System.out.println("Response Body: " + response.body());');
    lines.push('    }');
    lines.push('}');
    return lines.join('\n');
  }

  if (target === 'okhttp') {
    // OkHttp
    const lines = [];
    lines.push('import okhttp3.*;');
    lines.push('import java.io.IOException;');
    lines.push('');
    lines.push('public class OkHttpExample {');
    lines.push('    public static void main(String[] args) throws IOException {');
    lines.push('        OkHttpClient client = new OkHttpClient();');
    lines.push('');

    if (body) {
      lines.push('        MediaType mediaType = MediaType.parse("application/json; charset=utf-8");');
      lines.push(`        RequestBody requestBody = RequestBody.create(mediaType, "${body.replace(/"/g, '\\"')}");`);
      lines.push('        Request request = new Request.Builder()');
      lines.push(`                .url("${url}")`);
      lines.push(`                .method("${method}", requestBody)`);
    } else {
      lines.push('        Request request = new Request.Builder()');
      lines.push(`                .url("${url}")`);
      if (method !== 'GET') {
        lines.push(`                .method("${method}", null)`);
      }
    }

    for (const [k, v] of Object.entries(headers)) {
      lines.push(`                .addHeader("${k}", "${v.replace(/"/g, '\\"')}")`);
    }
    lines.push('                .build();');
    lines.push('');
    lines.push('        try (Response response = client.newCall(request).execute()) {');
    lines.push('            if (response.body() != null) {');
    lines.push('                System.out.println(response.body().string());');
    lines.push('            }');
    lines.push('        }');
    lines.push('    }');
    lines.push('}');
    return lines.join('\n');
  }

  if (target === 'spring') {
    // Spring RestTemplate
    const lines = [];
    lines.push('import org.springframework.http.*;');
    lines.push('import org.springframework.web.client.RestTemplate;');
    lines.push('');
    lines.push('public class RestTemplateExample {');
    lines.push('    public static void main(String[] args) {');
    lines.push('        RestTemplate restTemplate = new RestTemplate();');
    lines.push(`        String url = "${url}";`);
    lines.push('');
    lines.push('        HttpHeaders headers = new HttpHeaders();');
    for (const [k, v] of Object.entries(headers)) {
      lines.push(`        headers.set("${k}", "${v.replace(/"/g, '\\"')}");`);
    }
    lines.push('');
    if (body) {
      lines.push(`        String jsonBody = "${body.replace(/"/g, '\\"')}";`);
      lines.push('        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);');
    } else {
      lines.push('        HttpEntity<Void> entity = new HttpEntity<>(headers);');
    }
    lines.push('');
    lines.push(`        ResponseEntity<String> response = restTemplate.exchange(`);
    lines.push(`                url, HttpMethod.${method}, entity, String.class);`);
    lines.push('');
    lines.push('        System.out.println(response.getBody());');
    lines.push('    }');
    lines.push('}');
    return lines.join('\n');
  }

  if (target === 'fetch') {
    // JavaScript fetch
    const options = {
      method,
      headers
    };
    if (body) {
      try {
        options.body = JSON.parse(body);
      } catch {
        options.body = body;
      }
    }
    return `// JavaScript 原生 Fetch 请求
fetch('${url}', {
  method: '${method}',
  headers: ${JSON.stringify(headers, null, 2)},
  ${body ? `body: JSON.stringify(${JSON.stringify(options.body, null, 2)})` : ''}
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('Request error:', err));`;
  }

  return '';
}

/**
 * cURL 命令转多语言代码工具
 */
export default function CurlConverter() {
  const [curlInput, setCurlInput] = useState(SAMPLE_CURL);
  const [targetLang, setTargetLang] = useState('java11');
  const [copied, copy] = useCopyToClipboard();

  const parsed = useMemo(() => {
    return parseCurl(curlInput);
  }, [curlInput]);

  const outputCode = useMemo(() => {
    return generateCode(parsed, targetLang);
  }, [parsed, targetLang]);

  const handleCopy = () => {
    if (!outputCode) return;
    copy(outputCode);
  };

  return (
    <ToolLayout
      title="cURL 转多语言代码工具"
      desc="解析浏览器或终端 cURL 命令，一键转为 Java HttpClient、Spring RestTemplate、OkHttp 或 JS Fetch"
    >
      <section className="tool-section">
        <div className="tool-section-title">
          <span>cURL 命令输入</span>
          <div className="tool-action-bar" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="apple-btn apple-btn-secondary apple-btn-sm"
              onClick={() => setCurlInput(SAMPLE_CURL)}
            >
              加载示例 cURL
            </button>
            <button
              type="button"
              className="apple-btn apple-btn-ghost apple-btn-sm"
              onClick={() => setCurlInput('')}
            >
              清空
            </button>
          </div>
        </div>

        <textarea
          className="apple-textarea"
          style={{
            height: '130px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.85rem'
          }}
          value={curlInput}
          onChange={(e) => setCurlInput(e.target.value)}
          placeholder="在此粘贴 curl 'https://...' 命令..."
        />
      </section>

      {/* 结果展示 */}
      <section className="tool-section">
        <div className="tool-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>生成的目标代码</span>
            <select
              className="apple-input"
              style={{ width: '220px', padding: '0.3rem 0.6rem', fontSize: '0.825rem' }}
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              <option value="java11">Java 11+ HttpClient</option>
              <option value="spring">Java Spring RestTemplate</option>
              <option value="okhttp">Java OkHttp 4</option>
              <option value="fetch">JavaScript fetch</option>
            </select>
          </div>
          <button
            type="button"
            className={`apple-btn apple-btn-primary apple-btn-sm ${copied ? 'apple-btn-secondary' : ''}`}
            onClick={handleCopy}
            disabled={!outputCode}
          >
            {copied ? '✓ 已复制代码' : '复制代码'}
          </button>
        </div>

        <textarea
          readOnly
          className="apple-textarea"
          style={{
            height: '420px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.85rem',
            backgroundColor: 'var(--bg-surface-secondary)'
          }}
          value={outputCode}
        />
      </section>
    </ToolLayout>
  );
}
