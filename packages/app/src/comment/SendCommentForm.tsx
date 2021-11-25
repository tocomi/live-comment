import { Component, ChangeEvent, KeyboardEvent, ReactNode } from 'react'
import { CommentMessage } from '@/common/Message'

type PropsType = {
  onSubmit: (message: CommentMessage) => void
  sendWithCtrlEnter: boolean
}

type StateType = {
  comment: string
}

export class SendCommentForm extends Component<PropsType, StateType> {

  private canSendMessage: boolean

  constructor(props: Readonly<PropsType>) {
    super(props)
    this.state = {
      comment: '',
    }
    this.canSendMessage = false
  }

  private send = (): void => {
    if (this.props.sendWithCtrlEnter && !this.canSendMessage) {
      return
    }

    const comment = this.state.comment
    if (comment) {
      const type = 'comment'
      this.props.onSubmit({ type, comment })
      this.setState({
        comment: ''
      })
    }
  }

  private onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({
      comment: e.target.value
    })
  }

  private onKeyUp = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Control') {
      this.canSendMessage = false
    }
  }

  private onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    switch (e.key) {
      case 'Control':
        this.canSendMessage = true
        break
      case 'Enter':
        this.send()
        break
    }
  }

  private onMouseDown = (): void => {
    this.canSendMessage = true
    this.send()
    this.canSendMessage = false
  }

  private onTouchStart = (): void => {
    this.canSendMessage = true
    this.send()
    this.canSendMessage = false
  }

  render(): ReactNode {
    return (
      <form onSubmit={(e) => { e.preventDefault() }}>
        <input
          type="text"
          value={this.state.comment}
          onChange={this.onChange}
          onKeyUp={this.onKeyUp}
          onKeyDown={this.onKeyDown}
        />
        <input
          type="submit"
          autoComplete="off"
          value="💬"
          disabled={this.state.comment.length === 0}
          onMouseDown={this.onMouseDown}
          onTouchStart={this.onTouchStart}
        />
      </form>
    )
  }
}