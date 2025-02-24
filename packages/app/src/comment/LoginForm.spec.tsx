import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { LoginForm } from './LoginForm'
import { createHash } from '@/common/utils'
import { assertNotNullable } from '@/common/assert'
import { gotoCommentPage } from './utils/pages'
import { jest, test } from '@jest/globals'

jest.mock('./utils/pages')

afterEach(() => {
  window.localStorage.clear()
})

function getPasswordInput(): Element {
  const passwordInput = document.querySelector('input[name=\'password\']')
  assertNotNullable(passwordInput, 'passwordInput')
  return passwordInput
}

test('Room text field and its helper text', async () => {
  render(<LoginForm apiUrl="" />)
  const noInputHelperText = 'Input room name'

  const helperText = screen.getByText(noInputHelperText)
  expect(helperText).toBeVisible()

  const input = screen.getByRole('textbox')
  userEvent.type(input, 'r')
  await waitFor(() => {
    expect(helperText).not.toBeVisible()
  })
})

test('Password field and its helper text', async () => {
  render(<LoginForm apiUrl="" />)
  const noInputHelperText = 'Input password of the room'

  const helperText = screen.getByText(noInputHelperText)
  expect(helperText).toBeVisible()

  const input = document.querySelector('input[name=\'password\']')
  assertNotNullable(input, 'input')
  userEvent.type(input, 'p')
  await waitFor(() => {
    expect(helperText).not.toBeVisible()
  })
})

test('Login button is disabled if room is empty', async () => {
  render(<LoginForm apiUrl="" />)

  const roomInput = screen.getByRole('textbox')
  const passwordInput = getPasswordInput()
  const button = screen.getByRole('button')

  userEvent.type(roomInput, 'r')
  userEvent.type(passwordInput, 'p')
  await waitFor(() => { expect(button).toBeEnabled() })

  userEvent.clear(roomInput)
  await waitFor(() => { expect(button).toBeDisabled() })
})

test('Login button is disabled if password is empty', async () => {
  render(<LoginForm apiUrl="" />)

  const roomInput = screen.getByRole('textbox')
  const passwordInput = getPasswordInput()
  const button = screen.getByRole('button')

  userEvent.type(roomInput, 'r')
  userEvent.type(passwordInput, 'p')
  await waitFor(() => { expect(button).toBeEnabled() })

  userEvent.clear(passwordInput)
  await waitFor(() => { expect(button).toBeDisabled() })
})

test('Go to comment page if valid token exists', async () => {
  // exp: 9999999999999
  window.localStorage.setItem('token', 'ewogICJhbGciOiAiSFMyNTYiLAogICJ0eXAiOiAiSldUIgp9.ewogICJyb29tIjogInJvb20iLAogICJleHAiOiA5OTk5OTk5OTk5OTk5Cn0')

  render(<LoginForm apiUrl="" />)

  await waitFor(() => { expect(gotoCommentPage).toBeCalled() })
})

test('Show notification if message is stored', async () => {
  const message = 'notification'
  window.localStorage.setItem('App.notification', JSON.stringify({ message }))

  render(<LoginForm apiUrl="" />)

  await waitFor(() => {
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(message)
  })
})

test('Submit crednetail then OK', async () => {
  window.fetch = jest.fn<typeof window.fetch>().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      type: 'acn',
      attrs: {
        token: 'token'
      }
    })
  } as Response)
  render(<LoginForm apiUrl="" />)

  const roomInput = screen.getByRole('textbox')
  const passwordInput = getPasswordInput()
  const button = screen.getByRole('button')
  userEvent.type(roomInput, 'r')
  userEvent.type(passwordInput, 'p')
  await waitFor(() => { expect(button).toBeEnabled() })

  userEvent.click(button)
  await waitFor(() => {
    expect(gotoCommentPage).toBeCalled()
  })
})

test('Submit credential then failed', async () => {
  const message = 'message'
  window.fetch = jest.fn<typeof window.fetch>().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      type: 'error',
      error: 'ACN_FAILED',
      message,
    })
  } as Response)
  render(<LoginForm apiUrl="" />)

  const roomInput = screen.getByRole('textbox')
  const passwordInput = getPasswordInput()
  const button = screen.getByRole('button')
  userEvent.type(roomInput, 'r')
  userEvent.type(passwordInput, 'p')
  await waitFor(() => { expect(button).toBeEnabled() })

  userEvent.click(button)
  await waitFor(() => {
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(`Login failed (${message})`)
  })
})

test('Submit credential and unexpected message', async () => {
  const unexpected = { type: 'hoge' }
  window.fetch = jest.fn<typeof window.fetch>().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(unexpected)
  } as Response)
  render(<LoginForm apiUrl="" />)

  const roomInput = screen.getByRole('textbox')
  const passwordInput = getPasswordInput()
  const button = screen.getByRole('button')
  userEvent.type(roomInput, 'r')
  userEvent.type(passwordInput, 'p')
  await waitFor(() => { expect(button).toBeEnabled() })

  userEvent.click(button)
  await waitFor(() => {
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(`Login failed (${JSON.stringify(unexpected)})`)
  })
})

test('Keep login', async () => {
  const unexpected = { type: 'hoge' }
  window.fetch = jest.fn<typeof window.fetch>().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(unexpected)
  } as Response)
  render(<LoginForm apiUrl="" />)

  const roomInput = screen.getByRole('textbox')
  const passwordInput = getPasswordInput()
  const checkbox = screen.getByRole('checkbox')
  const button = screen.getByRole('button')
  userEvent.click(checkbox)
  userEvent.type(roomInput, 'r')
  userEvent.type(passwordInput, 'p')
  await waitFor(() => { expect(button).toBeEnabled() })

  userEvent.click(button)
  await waitFor(() => {
    expect(global.fetch).toBeCalled()
    const init = jest.mocked(global.fetch).mock.calls[0][1]
    expect(init?.body).toBe(JSON.stringify({
      type: 'acn',
      room: 'r',
      longLife: true,
      hash: createHash('p')
    }))
  })
})
