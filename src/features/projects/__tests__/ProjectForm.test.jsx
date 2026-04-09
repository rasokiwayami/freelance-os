import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectForm } from '../ProjectForm'

describe('ProjectForm', () => {
  it('タイトルが空のときバリデーションエラーが表示される', async () => {
    const onSubmit = vi.fn()
    render(<ProjectForm onSubmit={onSubmit} />)

    // タイトルを空のまま送信
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('タイトルは必須です')
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
