import { useState } from 'react';
import './PaymentModal.css';

export default function PaymentModal({ isOpen, onClose, onSuccess, planName, price }) {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!cardName.trim()) errs.cardName = 'Cardholder name is required';
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) errs.cardNumber = 'Enter a valid 16-digit card number';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) errs.expiry = 'Use MM/YY format';
    else {
      const [mm, yy] = expiry.split('/');
      const expDate = new Date(`20${yy}`, mm - 1);
      if (expDate < new Date()) errs.expiry = 'Card has expired';
    }
    if (!/^\d{3,4}$/.test(cvv)) errs.cvv = 'Valid CVV required';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    
    setProcessing(true);
    setPaymentError('');
    
    // Simulate payment API call
    setTimeout(() => {
      // Simulate random failure logic specifically asked by requirement
      if (cvv === '000' || cvv === '0000') {
        setPaymentError('Payment declined by your bank. Please try another card.');
        setProcessing(false);
      } else {
        setProcessing(false);
        onSuccess();
      }
    }, 1500);
  };

  return (
    <div className="pm-overlay">
      <div className="pm-modal">
        <button className="pm-close" onClick={onClose}>&times;</button>
        <h2 className="pm-title">Complete Payment</h2>
        <p className="pm-subtitle">You are upgrading to <strong>{planName}</strong> plan.</p>
        
        <div className="pm-summary">
          <div className="pm-sum-row">
            <span>Subscription:</span>
            <span>{planName}</span>
          </div>
          <div className="pm-sum-row pm-total">
            <span>Total amount:</span>
            <span>{price}</span>
          </div>
        </div>

        {paymentError && (
          <div className="pm-error-banner">
            {paymentError}
          </div>
        )}

        <div className="pm-form">
          <div className="pm-field">
            <label>Cardholder Name</label>
            <input 
              type="text" 
              placeholder="Name on card"
              value={cardName} 
              onChange={e => { setCardName(e.target.value); setErrors(prev => ({...prev, cardName: ''})); }} 
            />
            {errors.cardName && <span className="pm-error">{errors.cardName}</span>}
          </div>
          
          <div className="pm-field">
            <label>Card Number</label>
            <input 
              type="text" 
              placeholder="0000 0000 0000 0000" 
              maxLength="19"
              value={cardNumber} 
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
                setCardNumber(val); 
                setErrors(prev => ({...prev, cardNumber: ''}));
              }} 
            />
            {errors.cardNumber && <span className="pm-error">{errors.cardNumber}</span>}
          </div>
          
          <div className="pm-row">
            <div className="pm-field">
              <label>Expiry Date</label>
              <input 
                type="text" 
                placeholder="MM/YY" 
                maxLength="5"
                value={expiry} 
                onChange={e => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2,4);
                  setExpiry(val); 
                  setErrors(prev => ({...prev, expiry: ''}));
                }} 
              />
              {errors.expiry && <span className="pm-error">{errors.expiry}</span>}
            </div>
            
            <div className="pm-field">
              <label>CVV</label>
              <input 
                type="text" 
                placeholder="123" 
                maxLength="4"
                value={cvv} 
                onChange={e => { setCvv(e.target.value.replace(/\D/g, '')); setErrors(prev => ({...prev, cvv: ''})); }} 
              />
              {errors.cvv && <span className="pm-error">{errors.cvv}</span>}
            </div>
          </div>
        </div>

        <button className="pm-submit" onClick={handlePay} disabled={processing}>
          {processing ? 'Processing...' : `Pay ${price}`}
        </button>
      </div>
    </div>
  );
}
