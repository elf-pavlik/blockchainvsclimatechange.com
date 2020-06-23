import { LitElement, customElement, property, css, query } from 'lit-element'
import { html } from 'lit-html'

import { TextField } from '@material/mwc-textfield'
import '@material/mwc-textfield'
import { TextArea } from '@material/mwc-textarea'
import '@material/mwc-textarea'
import '@material/mwc-checkbox'
import '@material/mwc-button'
import '@material/mwc-formfield'

import { universities, emailProviders } from '@aliceingovernment/data'
import './solution-result'
import { SolutionResult } from './solution-result'
import config from './config'

@customElement('vote-form')
export class VoteForm extends LitElement {

  @property({ type: Array })
  solutions

  @property({ type: Array })
  stats

  @property({ type: Object })
  university

  @property({ type: Boolean })
  form = true

  get globalResults () {
    return this.stats.global.result
  }

  get results () {
      if (this.university) {
        return this.stats.country.find(u => u.code === this.university.slug).result
      } else {
          this.globalResults
      }
  }

  @property({ type: Number })
  expectedSolutions

  @property({ type: Array })
  private selectedSolutions = []

  @query('mwc-textfield[name=email]')
  protected emailField: TextField

  @query('mwc-textfield[name=name]')
  protected nameField: TextField
  
  @query('mwc-textarea[name=opinion]')
  protected opinionField: TextArea

  @query('#formfields-wrapper')
  protected formfieldsWrapper: HTMLElement

  @property({ type: String })
  email

  @property({ type: Boolean })
  nameValid = false

  @property({ type: Boolean })
  acceptValid = false

  @property({ type: Boolean })
  eligibleEmailDomain = false

  @property({ type: Boolean })
  nonUniversityEmailDomain = false

  @property({ type: String })
  state = 'initial'

  @property({ type: Boolean })
  withCheckboxes = true

  static styles = css`
    h3 {
        font-size: 1.75rem;
        font-weight: 500;
    }
    .inactive {
        display: none !important;
    }
    #formfields-wrapper div.formfield {
        margin: 1.5em 0;
    }

    mwc-button {
        --mdc-theme-primary: #fab114;
        --mdc-theme-on-primary: var(--light-color);
    }

    mwc-textfield, mwc-textarea {
        width: 100%;
        --mdc-theme-error: var(--university-color);
        --mdc-text-field-label-ink-color: var(--light-color);
        --mdc-text-field-outlined-idle-border-color: var(--light-color);
        --mdc-text-field-ink-color: var(--light-color);
        --mdc-theme-primary: var(--light-color);
    }

    #formfields-wrapper mwc-checkbox {
        --mdc-checkbox-unchecked-color: var(--light-color);
    }

    #formfields-wrapper mwc-formfield {
        --mdc-theme-text-primary-on-background: var(--light-color);
        --mdc-checkbox-mark-color: var(--highlight-color);
        --mdc-theme-secondary: var(--light-color);
        margin-top: -0.5em;
        margin-left: -0.5em;
    }
    
    p {
        margin-bottom: 0;
    }
    #side-by-side {
        display: flex;
        justify-content: space-between;
        margin-top: 1em;
    }

    .info, .error, #vote-exists, #please-confirm, #error {
        border-width: 1px;
        border-style: solid;
        padding: 0.5em;
        border-radius: 0.2em;
    }

    .info, #please-confirm {
        border-color: #267fb5;
        font-size: 0.9rem;
    }

    .error, #error {
        color: var(--university-color);
        border-color: var(--university-color);
    }

    .error {
        margin-top: 1em;
    }

    #vote-exists, #please-confirm p.primary, #error { 
        font-size: 1.5em;
    }

    #vote-exists {
        border-color: var(--highlight-color);
    }
    
    /* TODO: DRY */
    .step {
        display: block;
        width: 2em;
        height: 2em;
        margin: 0 auto 2rem;
        font-size: 3em;
        border: 2px solid;
        border-radius: 1.5em;
        text-align: center;
        line-height: 2em;
        color: var(--highlight-color);
    }

    #formfields-wrapper {
        padding: 30px;
        background-color: var(--highlight-color);
        color: var(--light-color);
        padding-top: 3rem;
    }

    #formfields-wrapper .step {
        color: var(--light-color);
    }

    .solution {
        display: flex;
        border-top: 1px solid gray;
        border-bottom: 1px solid gray;
        padding-top: 0.5rem;
    }

    .solution solution-result {
        display: block;
        width: 90%;
        padding-left: 1em;
        margin-bottom: 1em;
    }
  `
    solutionTemplate (solution) {
        return html`
        <div class="solution">
            <solution-result
              .solution=${solution}
              .university=${this.university}
              .results=${this.results}
              .globalResults=${this.globalResults}
            ></solution-result>
            ${this.withCheckboxes ? html`
                <mwc-checkbox
                    .checked="${this.selectedSolutions.find(s => s === solution.slug)}"
                    @change="${this.updateSelectedSolutions}"
                    data-slug=${solution.slug}>
                ></mwc-checkbox>
            ` : ''}
        </div>
        `
    }

    updateSelectedSolutions (event) {
        if (event.target.checked) {
            this.selectedSolutions = [
                ...this.selectedSolutions,
                event.target.dataset.slug
            ]
        } else {
            this.selectedSolutions = this.selectedSolutions.filter(s => s !== event.target.dataset.slug)
        }
    }


  eligibilityMessage () {
      if (this.email && !this.eligibleEmailDomain && !this.nonUniversityEmailDomain) {
          return html `
            <div class="info">
              ℹ️ Your email address doesn't appear to be from any of the
              participating universities. After you finish filling this form, we will contact you
              in order to add your university.
            </div>
          ` 
      }
  }

  nonUniversityEmailMessage () {
      if (this.email && this.nonUniversityEmailDomain) {
          return html `
            <div class="error">
              It appears like you've entered an email address not related to a university.
              Please enter an email address provided by your university.
            </div>
          ` 
      }
  }

  solutionsList () {
      const list = []
      if (this.results) {
        this.solutions.sort((a, b) => {
          const aResultIndex = this.results.indexOf(this.results.find(result => result.solution === a.slug))
          const bResultIndex = this.results.indexOf(this.results.find(result => result.solution === b.slug))
          return aResultIndex - bResultIndex
        })
      }
      for (const solution of this.solutions) {
        if (this.selectedSolutions.length < this.expectedSolutions
            || this.selectedSolutions.includes(solution.slug)) {
                list.push(this.solutionTemplate(solution))
            }
      }
      return html`
        <div id="solutions">
            ${list}
        </div>
      `
  }

  async handleSubmit (event) {
    this.state = 'pending'
    const draft: any = {
      email: this.email,
      name: this.nameField.value,
      opinion: this.opinionField.value ? this.opinionField.value : null,
      policiesAgreement: this.acceptValid,
      solutions: [...this.selectedSolutions]
    }
    // vote ready to submit
    try {
        const castedVoteResponse = await fetch(config.serviceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
        })
        this.selectedSolutions = []
        this.withCheckboxes = false
        setTimeout(() => this.formfieldsWrapper.scrollIntoView())
        if (castedVoteResponse.ok) {
        console.log('VOTE SUBMISSION SUCCEEDED')
        this.state = 'success'
        this.dispatchEvent(new CustomEvent('success'))
        } else {
        console.log('VOTE SUBMISSION FAILED')
        this.state = 'error'
        // if status 409 - vote for that email exists
        if (castedVoteResponse.status === 409) {
            this.state = 'vote-already-exists'
        }
        }
    } catch (err) {
      this.state = 'error'
      setTimeout(() => this.formfieldsWrapper.scrollIntoView())
    }
  }

  formPartial() {
    return html`
    <div>Share your opinion with the world</div>
    ${ this.expectedSolutions === this.selectedSolutions.length ?
        '' :
        html`
        <div class="error">
            ⚠️ Please select
            ${this.expectedSolutions - this.selectedSolutions.length}
            more ${this.selectedSolutions.length === 1 ? 'solution' : 'solutions'}
        </div>
        `  
    }
    <div class="formfield">
        <mwc-textfield
            outlined
            required
            helperPersistent
            name="email"
            type="email"
            label=" University email"
            helper="provided by your university"
            validationMessage="please enter valid email address"
            maxLength="50">
        </mwc-textfield>
    </div>
    ${this.eligibilityMessage()}
    ${this.nonUniversityEmailMessage()}
    <div class="formfield">
        <mwc-textfield
            outlined
            required
            name="name"
            type="text"
            label="Full name"
            validationMessage="please enter your full name"
            maxLength="50">
        </mwc-textfield>
    </div>
    <div>
        What should be the role of our universities in addressing climate change?
    </div>
    <div class="formfield">
        <mwc-textarea
            outlined
            charCounter
            helperPersistent
            name="opinion"
            label="Opinion"
            helper=""
            maxLength="160">
        </mwc-textarea>
    </div>
        <p><a href="/privacy-policy" style="color:#ffffff;"><u>Privacy Policy</u></a>, <a href="/terms-of-service" style="color:#ffffff;"><u>Terms of Service</u></a>, and I'm 18+ years old.</p>
        <div id="side-by-side">
            <mwc-formfield label="I accept *">
                <mwc-checkbox
                    required
                    name="policiesAgreement"
                    @change=${(e) => this.acceptValid = e.target.checked}
                ></mwc-checkbox>
            </mwc-formfield>
            <mwc-button
                raised
                ?disabled=${
                    !this.email ||
                    this.nonUniversityEmailDomain ||
                    !this.nameValid ||
                    !this.acceptValid ||
                    this.selectedSolutions.length !== this.expectedSolutions
                }
                @click=${this.handleSubmit}
                label="Submit">
            </mwc-button>
        </div>
    `
  }
  
  statePartial () {
    switch (this.state) {
      case 'pending':
        return html`
          <p id="submitting">Submitting...</p>
        `
      case 'success':
          return html`
            <div id="please-confirm">
                <p class="primary">Please check your inbox for email with confirmation link</p>
                <p>(you can close this browser tab).</p>
            </div>
          `
      case 'vote-already-exists':
        return html`
            <p id="vote-exists">We already have vote for this email address, please search your inbox for permalink to your vote.</p>
        `
      case 'error':
          return html`
            <p id="error">An error have occured, we will investigate it! Please try voting again tomorrow. Thank you for your patience.</p>
          `
      default:
        return this.formPartial()
    }
  }

  render () {
    return html `
        ${this.solutionsList()}
        <div id="formfields-wrapper" class="${ this.form ? '' : 'inactive'}">
            <div class="step">2</div>
            <h3>Complete your vote</h3>
            ${this.statePartial()}
        </div>
    `
  }

  firstUpdated() {
      this.emailField.validityTransform = (newValue, nativeValidity) => {
          this.email = null
          this.eligibleEmailDomain = false
          this.nonUniversityEmailDomain = false
          if (nativeValidity.valid) {
              this.email = newValue
              const domain = newValue.split('@')[1]
              for (const univeristy of universities) {
                  for (const eligibleDomain of univeristy.domains) {
                      if (domain.match(new RegExp(`${eligibleDomain}$`))) {
                          this.eligibleEmailDomain = true
                      }
                  }
              }
              if (!this.eligibleEmailDomain) {
                  for (const provider of emailProviders) {
                      if (domain.match(new RegExp(`${provider}$`))) {
                          this.nonUniversityEmailDomain = true
                      }
                  }
              }
          }
          return nativeValidity
      }
      this.nameField.validityTransform = (newValue, nativeValidity) => {
          this.nameValid = false
          if (nativeValidity.valid) {
            this.nameValid = true
          }
          return nativeValidity
      }
  }
}
