import React, { useState } from 'react';

const UserFeedback: React.FC = () => {
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle feedback submission logic here (e.g., send to backend)
        setSubmitted(true);
    };

    return (
        <div className="feedback-section">
            <h2>We value your feedback!</h2>
            {submitted ? (
                <p>Thank you for your feedback!</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Enter your feedback here"
                        required
                    />
                    <button type="submit">Submit</button>
                </form>
            )}
        </div>
    );
};

export default UserFeedback; 