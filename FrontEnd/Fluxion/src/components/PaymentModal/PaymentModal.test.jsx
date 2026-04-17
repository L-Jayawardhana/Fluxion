/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import PaymentModal from './PaymentModal';

describe('PaymentModal Validation Features', () => {
  afterEach(cleanup);
  it('Should bypass rendering completely when not open', () => {
    const { container } = render(
      <PaymentModal isOpen={false} planName="Pro" price="$29 / mo" onSuccess={() => {}} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('Should successfully trigger frontend rejection alerts on intentionally failed card validations', async () => {
    render(
      <PaymentModal isOpen={true} planName="Pro" price="$29 / mo" onSuccess={() => {}} onClose={() => {}} />
    );

    // Provide CVV 000 intentionally triggering failure bounds
    const cardholderInput = screen.getByPlaceholderText('Name on card');
    const numberInput = screen.getByPlaceholderText('0000 0000 0000 0000');
    const expiryInput = screen.getByPlaceholderText('MM/YY');
    const cvvInput = screen.getByPlaceholderText('123');

    // Load bounds manually
    fireEvent.change(cardholderInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(numberInput, { target: { value: '1111 1111 1111 1111' } });
    fireEvent.change(expiryInput, { target: { value: '12/35' } });
    fireEvent.change(cvvInput, { target: { value: '000' } });

    // Assert Submit button hits failure block
    const payButton = screen.getByText('Pay $29 / mo');
    fireEvent.click(payButton);
    
    // Test transitions processing to failure mock boundary
    expect(screen.getByText('Processing...')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Payment declined by your bank. Please try another card.')).toBeDefined();
    }, { timeout: 2000 });
  });

  it('Should successfully execute onSuccess after valid payment properties are verified', async () => {
    const onSuccessMock = vi.fn();
    render(
      <PaymentModal isOpen={true} planName="Enterprise" price="$199 / mo" onSuccess={onSuccessMock} onClose={() => {}} />
    );

    // Provide proper verified card details
    fireEvent.change(screen.getByPlaceholderText('Name on card'), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '4444 4444 4444 4444' } });
    fireEvent.change(screen.getByPlaceholderText('MM/YY'), { target: { value: '10/38' } });
    fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '123' } });

    fireEvent.click(screen.getByText('Pay $199 / mo'));

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('Should flag missing card numbers missing explicit format bounds', () => {
    render(
      <PaymentModal isOpen={true} planName="Pro" price="$29 / mo" onSuccess={() => {}} onClose={() => {}} />
    );

    fireEvent.change(screen.getByPlaceholderText('Name on card'), { target: { value: 'James' } });
    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '123' } }); 

    fireEvent.click(screen.getByText('Pay $29 / mo'));

    // Catches local error logic rejecting API push
    expect(screen.getByText('Enter a valid 16-digit card number')).toBeDefined();
  });
});
