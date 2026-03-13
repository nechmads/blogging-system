import { useCallback, useEffect, useRef, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

type CheckoutCompletedCallback = () => void

interface UsePaddleOptions {
  onCheckoutCompleted?: CheckoutCompletedCallback
}

export function usePaddle(options: UsePaddleOptions = {}) {
  const paddleRef = useRef<Paddle | undefined>(undefined)
  const initializedRef = useRef(false)
  const [ready, setReady] = useState(false)

  // Store callback in a ref so we don't re-initialize when it changes
  const onCheckoutCompletedRef = useRef(options.onCheckoutCompleted)
  onCheckoutCompletedRef.current = options.onCheckoutCompleted

  useEffect(() => {
    if (initializedRef.current) return

    const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
    if (!token) {
      console.warn('Paddle client token not configured (VITE_PADDLE_CLIENT_TOKEN)')
      return
    }

    initializedRef.current = true

    const environment = import.meta.env.VITE_PADDLE_ENVIRONMENT === 'production'
      ? 'production'
      : 'sandbox'

    initializePaddle({
      token,
      environment,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          onCheckoutCompletedRef.current?.()
        }
      },
    }).then((paddle) => {
      if (paddle) {
        paddleRef.current = paddle
        setReady(true)
      }
    })
  }, [])

  const openCheckout = useCallback(
    (priceId: string, userEmail?: string, userId?: string) => {
      if (!paddleRef.current) {
        console.warn('Paddle not initialized yet')
        return
      }

      paddleRef.current.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        ...(userEmail ? { customer: { email: userEmail } } : {}),
        ...(userId ? { customData: { userId } } : {}),
      })
    },
    [],
  )

  return {
    paddle: paddleRef.current,
    ready,
    openCheckout,
  }
}
