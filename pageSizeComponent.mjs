const PAGE_SIZES = {
  'US Letter': ['8.5in', '11in'],
  'US Legal': ['8.5in', '14in'],
  'A4': ['210mm', '297mm'],
};

export class PageSize extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    // Create (nested) span elements
    this.selector = document.createElement('select');
    const custOpt = document.createElement('option');
    custOpt.label = 'Custom';
    this.selector.appendChild(custOpt);
    for (const label of Object.keys(PAGE_SIZES)) {
      const opt = document.createElement('option');
      opt.label = label;
      opt.value = label;
      this.selector.appendChild(opt);
    }

    // const widthLabel = document.createElement('label');
    // widthLabel.appendChild(document.createTextNode('Width: '));
    this.widthInput = document.createElement('input');
    this.widthInput.type = 'text';
    // widthLabel.appendChild(this.widthInput);

    // const heightLabel = document.createElement('label');
    // heightLabel.appendChild(document.createTextNode('Height: '));
    this.heightInput = document.createElement('input');
    this.heightInput.type = 'text';
    // heightLabel.appendChild(this.heightInput);

    // Create some CSS to apply to the shadow DOM
    const style = document.createElement("style");
    style.textContent = `
    input {
      width: 4em;
    }

    .invalid {
      outline: 1px solid red;
    }
    `;

    // attach the created elements to the shadow DOM
    this.shadowRoot.append(
      style,
      this.selector,
      // document.createElement('br'),
      document.createTextNode(' '),
      this.widthInput,
      document.createTextNode(' ✗ '),
      this.heightInput);
    this.#setPreset('US Letter');
    this.#onChange();
  }

  connectedCallback() {
    this.selector.addEventListener('change', (e) => {
      const selected = this.selector.value;
      if (Object.keys(PAGE_SIZES).includes(selected)) {
        this.#setPreset(selected);
      }
    });
    this.widthInput.addEventListener('keyup', () => this.#onChange());
    this.heightInput.addEventListener('keyup', () => this.#onChange());
  }

  #setPreset(name) {
    const [w, h] = PAGE_SIZES[name];
    this.widthInput.value = w;
    this.heightInput.value = h;
    this.#onChange();
  }

  #onChange() {
    const [oldW, oldH] = [this.width, this.height];

    // set the component's output width and height (if valid)
    try {
      this.width = unitStrToInches(this.widthInput.value);
      this.widthInput.classList.toggle('invalid', false);
    } catch (e) {
      console.log(e);
      this.widthInput.classList.toggle('invalid', true);
    }
    try {
      this.height = unitStrToInches(this.heightInput.value);
      this.heightInput.classList.toggle('invalid', false);
    } catch (e) {
      console.log(e);
      this.heightInput.classList.toggle('invalid', true);
    }

    // if this corresponds to a template, select the template
    let hasPresetChanged = false;
    for (const optI in this.selector.options) {
      const preset = this.selector.options[optI].value;
      if (PAGE_SIZES[preset]) {
        const [tw, th] = PAGE_SIZES[preset].map(unitStrToInches);
        if (tw === this.width && th === this.height) {
          this.selector.selectedIndex = optI;
          hasPresetChanged = true;
          break;
        }
      }
    }
    if (!hasPresetChanged) {
      this.selector.selectedIndex = 0; // select "Custom"
    }

    if (this.width !== oldW || this.height !== oldH) {
      this.dispatchEvent(new Event('change'));
    }
  }
}

export function unitStrToInches(unitStr) {
  const match = unitStr.match(/^\s*(\d*(\.\d+)?) *(\"|in|inches|mm|cm)\s*$/i);
  if (!match) {
    throw new Error('Cannot parse measurement string');
  }
  const [, num, , unit] = match;
  const val = Number(num);
  if (val === 0) {
    throw new Error('Cannot accept a zero-value measurement');
  }
  const unitNormal = unit.toLowerCase();
  if (unitNormal === 'in' || unitNormal === '"' || unitNormal === 'inches') {
    return val;
  }
  if (unitNormal === 'mm') {
    return val * 0.03937008;
  }
  if (unitNormal === 'cm') {
    return val * 0.3937008;
  }
  throw new Error('Invalid measurement unit');
}
