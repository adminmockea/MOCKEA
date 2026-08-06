import DOMPurify from 'dompurify';

const isImageUrl = (url) => /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i.test(url);

const convertMarkdownImageLinks = (text) => {
  return text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (match, alt, url) => {
    return `<img src="${url}" alt="${alt}" class="max-w-full h-auto rounded-2xl border border-slate-200 shadow-sm" />`;
  });
};

const convertMarkdownLinks = (text) => {
  return text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label, url) => {
    return `<a href="${url}" target="_blank" rel="noreferrer noopener" class="underline decoration-primary/50 text-primary hover:text-primary-focus">${label}</a>`;
  });
};

const convertPlainUrlsToLinks = (text) => {
  return text.replace(/(?<!href=["'])(https?:\/\/[^\s<>'"`]+)/g, (match) => {
    return `<a href="${match}" target="_blank" rel="noreferrer noopener" class="underline decoration-primary/50 text-primary hover:text-primary-focus">${match}</a>`;
  });
};

const convertInlineText = (text) => {
  const trimmed = text.trim();
  const plainUrlMatch = trimmed.match(/^\(?\s*(https?:\/\/[^\s<>'"`]+)\s*\)?$/);

  if (plainUrlMatch) {
    const url = plainUrlMatch[1];
    if (isImageUrl(url)) {
      return `<img src="${url}" alt="" class="max-w-full h-auto rounded-2xl border border-slate-200 shadow-sm" />`;
    }
    return `<a href="${url}" target="_blank" rel="noreferrer noopener" class="underline decoration-primary/50 text-primary hover:text-primary-focus">${url}</a>`;
  }

  const withImages = convertMarkdownImageLinks(text);
  const withLinks = convertMarkdownLinks(withImages);
  return convertPlainUrlsToLinks(withLinks);
};

const convertMarkdownTableBlock = (lines) => {
  if (!lines.length) return "";

  const rows = lines
    .map((line) => line.trim().replace(/\s*\|\s*$/u, "").replace(/^\s*\|\s*/u, ""))
    .filter((line) => line !== "");
  if (!rows.length) return "";

  const cells = (row) => row.split("|").map((cell) => cell.trim());
  const isSeparatorRow = (row) => cells(row).every((cell) => /^:?-+:?$/.test(cell));

  let html = '<div class="overflow-x-auto my-6"><table class="table-auto w-full text-left border-collapse border border-slate-200 text-sm">';
  const headerCells = cells(rows[0]);
  html += '<thead><tr class="bg-slate-100 text-slate-800 font-bold">';
  headerCells.forEach((cell) => {
    html += `<th class="border border-slate-200 p-3 align-top">${convertInlineText(cell)}</th>`;
  });
  html += '</tr></thead>';

  let bodyRows = rows.slice(1);
  if (bodyRows.length > 0 && isSeparatorRow(bodyRows[0])) {
    bodyRows = bodyRows.slice(1);
  }

  html += '<tbody class="text-slate-700">';
  bodyRows.forEach((row, rowIndex) => {
    const rowClass = rowIndex % 2 === 1 ? 'bg-slate-50/30' : '';
    const rowCells = cells(row);
    html += `<tr class="${rowClass}">`;
    rowCells.forEach((cell) => {
      html += `<td class="border border-slate-200 p-3 align-top">${convertInlineText(cell)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  return html;
};

export const convertMarkdownContentToHtml = (rawText) => {
  const text = rawText == null ? "" : String(rawText).trim();
  if (!text) return "";

  const hasHtmlTags = /<\/?[a-z][\s\S]*?>/i.test(text);
  if (hasHtmlTags) {
    return DOMPurify.sanitize(text, { ADD_TAGS: ["img", "th", "td", "tr", "thead", "tbody", "table", "div"], ADD_ATTR: ["class", "src", "alt", "href", "target", "rel", "colspan", "rowspan"] });
  }

  const lines = text.split(/\r?\n/);
  const htmlParts = [];
  let index = 0;

  while (index < lines.length) {
    if (lines[index].trim() === "") {
      htmlParts.push('<div class="h-4"></div>');
      index += 1;
      continue;
    }

    if (lines[index].trim().startsWith("|")) {
      const tableLines = [];
      let currentLine = "";

      while (index < lines.length) {
        const trimmed = lines[index].trim();
        if (trimmed.startsWith("|")) {
          if (currentLine) {
            tableLines.push(currentLine);
          }
          currentLine = trimmed;
          index += 1;
        } else if (currentLine) {
          if (trimmed === "" && currentLine.endsWith("|")) {
            tableLines.push(currentLine);
            currentLine = "";
            break;
          }
          currentLine += "\n" + trimmed;
          index += 1;
        } else {
          break;
        }
      }
      if (currentLine) {
        tableLines.push(currentLine);
      }
      htmlParts.push(convertMarkdownTableBlock(tableLines));
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && lines[index].trim() !== "" && !(lines[index].trim().startsWith("|") && lines[index].trim().endsWith("|"))) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    const paragraphText = paragraphLines.map((line) => convertInlineText(line)).join("<br/>");
    htmlParts.push(`<p class="leading-relaxed">${paragraphText}</p>`);
  }

  return DOMPurify.sanitize(htmlParts.join("\n"), { ADD_TAGS: ["img", "th", "td", "tr", "thead", "tbody", "table", "div"], ADD_ATTR: ["class", "src", "alt", "href", "target", "rel", "colspan", "rowspan"] });
};
