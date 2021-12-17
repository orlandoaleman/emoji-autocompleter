import fetchJSON from './fetchJSON.js'

const thisModuleUrl = import.meta.url.split('/').slice(0, -1).join('/');

let emojiData;
let emojiKeys;

let emojiDataPath = `${thisModuleUrl}/emoji-v2.min.json`;

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

      if (this.maxMatches && matchesExpanded.length >= this.maxMatches) { break; }
    }

    this._matches = matchesExpanded;
    return this._updatePicker(lastWord);
  }

  _onInput(event) {
    if (!emojiData) { return; }

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
}

export { EmojiPicker, configEmojiPicker };
