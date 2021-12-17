import fetchJSON from './fetchJSON.js'

const thisModuleUrl = import.meta.url.split('/').slice(0, -1).join('/');

let emojiData;
let emojiKeys;

let emojiDataPath = `${thisModuleUrl}/emoji-v2.min.json`;

var keyMap = {
  'BACKSPACE'    : 8,
  'TAB'          : 9,
  'NEWLINE'      : 10,
  'ENTER'        : 13,
  'SHIFT'        : 16,
  'CTRL'         : 17,
  'ALT'          : 18,
  'PAUSE'        : 19,
  'ESC'          : 27,
  'SPACE'        : 32,
  'PAGEUP'       : 33,
  'PAGEDOWN'     : 34,

  'LEFT'         : 37,
  'UP'           : 38,
  'RIGHT'        : 39,
  'DOWN'         : 40,
  'HOME'         : 36,
  'END'          : 35,

  'INS'          : 45,
  'SUPR'         : 46,

  'LWINDOW'      : 91,
  'RWINDOW'      : 92,
  'SEL'          : 93,

  'F1'           : 112,
  'F2'           : 113,
  'F3'           : 114,
  'F4'           : 115,
  'F5'           : 116,
  'F6'           : 117,
  'F7'           : 118,
  'F8'           : 119,
  'F9'           : 120,
  'F10'          : 121,
  'F11'          : 122,
  'F12'          : 123,

  'CAPSLOCK'     : 20,
  'NUMLOCK'      : 144,
  'SCROLLLOCK'   : 144,

  '0'            : 48,
  '1'            : 49,
  '2'            : 50,
  '3'            : 51,
  '4'            : 52,
  '5'            : 53,
  '6'            : 54,
  '7'            : 55,
  '8'            : 56,
  '9'            : 57,

  'A'            : 65,
  'B'            : 66,
  'C'            : 67,
  'D'            : 68,
  'E'            : 69,
  'F'            : 70,
  'G'            : 71,
  'H'            : 72,
  'I'            : 73,
  'J'            : 74,
  'K'            : 75,
  'L'            : 76,
  'M'            : 77,
  'N'            : 78,
  'O'            : 79,
  'P'            : 80,
  'Q'            : 81,
  'R'            : 82,
  'S'            : 83,
  'T'            : 84,
  'U'            : 85,
  'V'            : 86,
  'W'            : 87,
  'X'            : 88,
  'Y'            : 89,
  'Z'            : 90,

  'a'            : 97,
  'b'            : 98,
  'c'            : 99,
  'd'            : 100,
  'e'            : 101,
  'f'            : 102,
  'g'            : 103,
  'h'            : 104,
  'i'            : 105,
  'j'            : 106,
  'k'            : 107,
  'l'            : 108,
  'm'            : 109,
  'n'            : 110,
  'o'            : 111,
  'p'            : 112,
  'q'            : 113,
  'r'            : 114,
  's'            : 115,
  't'            : 116,
  'u'            : 117,
  'v'            : 118,
  'w'            : 119,
  'x'            : 120,
  'y'            : 121,
  'z'            : 122,

  "AT"           : 64, // ARROBA

  'SLASH'        : 191,
  'LEFTBRACKET'  : 219,
  'BACKSLASH'    : 220,
  'RIGHTBRACKET' : 221,
  'APOSTROPHE'   : 222
};

function configEmojiPicker({ emojiDataPath: emojiDataPath_ }) {
  emojiDataPath = emojiDataPath_;
}

class EmojiPicker {
  constructor(config) {
    let {
      input,
      inputSel, 
      pickerContainer,
      lang = 'en',
      fireEvents = ['input', 'keyup'],
      replaceOnPick = true,
      autoReplaceOnEnter = false,
      onChange,
      onEmoji,
      maxMatches,
    } = config || {};

    this.inputSel = inputSel;
    this.lang = lang;
    this.autoReplaceOnEnter = autoReplaceOnEnter;
    this.replaceOnPick = replaceOnPick;
    this.maxMatches = maxMatches;

    this.onChange = onChange;
    this.onEmoji = onEmoji;

    this._matches = [];


    input = input || document.querySelector(inputSel);
    this._input = input;

    const picker = this._picker = document.createElement('div');
    picker.setAttribute('class', 'picker');  

    if (!pickerContainer) {
      pickerContainer = input.parentNode;
    }

    pickerContainer.insertBefore(picker, input.nextSibling);

    fireEvents.map((event) => input.addEventListener(event, e => this._onInput(e)));

    if (!emojiData) {
      this.loadEmojiData();
    }
  }

  loadEmojiData() {
    fetchJSON(emojiDataPath)
      .then(data => {
        if (!data) { return; }      
        emojiData = data;
        emojiKeys = Object.keys(data);

        // Indexación para búsqueda
        for (let i = 0; i < emojiKeys.length; i++) {
          const key = emojiKeys[i];
          let str = this._titleForKey(key);
          let searchText = str.normalize("NFD").replace(/[\p{Diacritic}\(\)\.,]/gu, "").toLowerCase();
          emojiData[key].searchText = searchText;
          // console.log( key, 'str', str, '====>', searchText);
        }
      })
    .catch(err => console.error(err))
  }

  i18nKey(key) {
    return this._titleForKey(key);
  }

  _createLink(str, match, method) {
    const link = document.createElement('a');
    link.innerHTML = match.emoji;
    link.setAttribute('title', match.title);
    link.setAttribute('class', 'emoji');
    link.addEventListener('click', () => method(str, match.emoji));
    return link
  }

  _clearPicker() {
    this._picker.innerHTML = '';
  }
  
  _updateText(word, emoji) {
    if (this.replaceOnPick) {
      const input = this._input;
      input.value = input.value.replace(word, emoji);
      input.focus()
    }

    if (this.onEmoji) {
      this.onEmoji({ emoji, word: word});
    }

    this._clearPicker();
    this.onChange && this.onChange({ str: '', matches: [] });
  }

  _updatePicker(str) {
    const picker = this._picker;
    this._clearPicker() & this._matches.forEach(match => {
      if (match.variations) {
        match.variations.forEach(variation => {
          let customMatch = { ...match, emoji: variation };
          picker.appendChild(this._createLink(str, customMatch, this._updateText.bind(this)));
        });
        return;
      }
      picker.appendChild(this._createLink(str, match, this._updateText.bind(this)));
    });
  }


  _titleForKey(k) {
    return (emojiData[k] && emojiData[k][this.lang]) ? emojiData[k][this.lang] : k 
  }

  _emojiForKey(k) {
    return emojiData[k].c;
  }
  
  _find(lastWord) {
    let str = lastWord.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const match = new RegExp(`${str}`);
    let matches = 
      emojiKeys
        .filter(k => match.test( emojiData[k].searchText ) )
        .slice(0, this.maxMatches);

    if (!matches.length) { 
      this._matches = [];
      return;
     }

    let matchesExpanded = [];
    let emojiTratado = {};
    for(let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (emojiTratado[m.emoji]) { continue; }  

      let title = this._titleForKey(m);   
      if (emojiData[m].variations) {
        emojiData[m].variations.forEach( emoji => {
          if (emojiTratado[emoji]) { return; }
          matchesExpanded.push({ emoji, title, });
        });
      }
      else {
        matchesExpanded.push({ emoji: this._emojiForKey(m), title, });
      }

      if (this.maxMatches && matchesExpanded.length >= this.maxMatches) {
        matchesExpanded = matchesExpanded.slice(0, this.maxMatches);
        break; 
      }
    }

    this._matches = matchesExpanded;
    return this._updatePicker(lastWord);
  }

  _onInput(event) {
    if (!emojiData) { return; }
    if (event.type === "keyup" && this.isControl(event.keyCode)) {
       return;
    }

    const { value } = event.target;
    const lastWord = value.substring(value.lastIndexOf(' ') + 1, value.length);
    const match = /\b[a-zA-Z0-9]{2,}/

    if (this._matches.length && lastWord.match(match)) {
      if (this.autoReplaceOnEnter && event.keyCode === 13) {
        this._updateText(lastWord, this._matches[0].emoji);
        return;
      }
    }

    if (lastWord.match(match)) {
      this._find(lastWord);
    }
    else {
      this._matches = [];
    }
    if ( !this._matches.length ) {
      this._clearPicker();
    }

    this.onChange && this.onChange({ str: lastWord, matches: this._matches });
  }

  destroy() {    
    this._input = this._picker = null;
  }
  
  isMove(keyCode) {
    return [ keyMap.LEFT, keyMap.UP, keyMap.RIGHT, keyMap.DOWN ].indexOf( keyCode ) !== -1;
  }

  isNewLine(keyCode) {
    return [ keyMap.NEWLINE, keyMap.ENTER ].indexOf( keyCode ) !== -1;
  }

  isNumber(keyCode) {
    return keyCode > 47 && keyCode < 58;
  }

  isControl( keyCode ) {
    return ( keyCode < keyMap['0'] && [ keyMap.NEWLINE, keyMap.ENTER, keyMap.SPACE ].indexOf( keyCode ) === -1 )
            || ( [ keyMap.INS, keyMap.SUPR, keyMap.LWINDOW, keyMap.RWINDOW, keyMap.SEL, keyMap.CAPSLOCK, keyMap.NUMLOCK, keyMap.SCROLLLOCK ].indexOf( keyCode ) !== -1 )
            || (keyCode >= keyMap.F1 && keyCode <= keyMap.F12 );
  }
  
}

export { EmojiPicker, configEmojiPicker };
