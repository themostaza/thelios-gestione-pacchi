// prettier.config.js, .prettierrc.js, prettier.config.cjs, or .prettierrc.cjs

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  printWidth: 200, // Numero massimo di caratteri per riga prima del wrapping automatico
  tabWidth: 2, // Numero di spazi per un'indentazione (di solito 2 o 4)
  useTabs: false, // Usa tab invece di spazi (false = spazi, true = tab)
  semi: false, // Usa punto e virgola alla fine delle righe (true = sì, false = no)
  singleQuote: true, // Usa virgolette singole per le stringhe invece delle doppie (true = sì, false = no)
  jsxSingleQuote: true, // Usa virgolette singole nel JSX (true = sì, false = no)
  trailingComma: 'es5', // Virgole finali (none, es5, all)
  bracketSpacing: true, // Spazio tra parentesi in oggetti { foo: bar } (true = sì, false = no)
  bracketSameLine: false, // Mette `>` alla fine della stessa riga in JSX (true = sì, false = no)
  arrowParens: 'always', // Parentesi attorno ai parametri delle arrow functions (always, avoid)
  proseWrap: 'preserve', // Controlla il wrapping del testo nei file di markdown (always, never, preserve)
  htmlWhitespaceSensitivity: 'css', // Controlla lo spazio bianco nell'HTML (css, strict, ignore)
  endOfLine: 'lf', // Tipo di newline (lf, crlf, cr, auto)
  quoteProps: 'as-needed', // Virgolette attorno alle chiavi degli oggetti (as-needed, consistent, preserve)
  embeddedLanguageFormatting: 'auto', // Formatta il codice all'interno delle stringhe template (auto, off)
  singleAttributePerLine: true,
}

module.exports = config
