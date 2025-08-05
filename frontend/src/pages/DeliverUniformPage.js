import React from 'react';
import { Container, Alert } from 'react-bootstrap';

function DeliverUniformPage() {
  return (
    <Container className="mt-5">
      <Alert variant="success">
        <Alert.Heading>صفحة تسليم الزي (نسخة التشخيص)</Alert.Heading>
        <hr />
        <p className="mb-0">
          إذا كنت ترى هذه الرسالة، فهذا يعني أن نظام التوجيه والربط يعمل بشكل صحيح.
        </p>
      </Alert>
    </Container>
  );
}

export default DeliverUniformPage;
