import * as Bob from '@bob-plug/core';

import isEnglish from 'is-english';

interface QueryOption {
  to?: Bob.Language;
  from?: Bob.Language;
  cache?: string;
  timeout?: number;
}

var resultCache = new Bob.CacheResult('translate-result');

/**
 * @description 翻译
 * @param {string} text 需要翻译的文字内容
 * @param {object} [options={}]
 * @return {object} 一个符合 bob 识别的翻译结果对象
 */
async function _translate(text: string, options: QueryOption = {}): Promise<Bob.TranslateResult> {
  const { from = 'auto', to = 'auto', cache = 'enable', timeout = 10000 } = options;
  const cacheKey = `${text}${from}${to}`;
  if (cache === 'enable') {
    const _cacheData = resultCache.get(cacheKey);
    if (_cacheData) return _cacheData;
  } else {
    resultCache.clear();
  }

  const result: Bob.TranslateResult = { from, to, toParagraphs: ['暂无释义'] };
  try {
    if (isEnglish(text) && text.length < 100) {
      const api = `https://lab.magiconch.com/api/nbnhhsh/guess`;
      const [err, res] = await Bob.util.asyncTo<Bob.HttpResponse>(
        Bob.api.$http.post({
          timeout,
          url: api,
          header: {
            'Content-Type': 'application/json;charset=UTF-8',
          },
          body: { text },
        }),
      );
      if (err) Bob.api.$log.error(err);
      const resData = res?.data;
      // [{"name":"lol","trans":["大笑","英雄联盟"]}]
      const str: string[] = [];
      resData.forEach((row: any) => {
        if (Bob.util.isArrayAndLenGt(row?.trans, 0)) {
          str.push(...row.trans);
        }
      });
      if (str.length) result.toParagraphs = [str.join('; ')];
    }
  } catch (error) {
    throw Bob.util.error('api', '数据解析错误出错', error);
  }

  if (cache === 'enable') {
    resultCache.set(cacheKey, result);
  }
  return result;
}

export { _translate };
