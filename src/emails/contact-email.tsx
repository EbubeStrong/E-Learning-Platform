import {
  Body,
  Container,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ContactEmailProps } from "@/types/ui";

export default function ContactEmail({ name, email, message }: ContactEmailProps) {
  return (
    <Html lang="en">
      <Preview>A new message from the Quizora contact form</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New message via Quizora</Heading>
          <Text style={paragraph}>Someone reached out through the contact form on the site.</Text>

          <Hr style={divider} />

          <Section>
            <Text style={label}>Name</Text>
            <Text style={value}>{name}</Text>

            <Text style={label}>Email</Text>
            <Text style={value}>{email}</Text>

            <Text style={label}>Message</Text>
            <Text style={value}>{message}</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>Sent automatically from the Quizora contact form.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f3eee7",
  fontFamily:
    "Georgia, 'Times New Roman', serif",
  padding: "32px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4dccd",
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const heading = {
  color: "#2b2118",
  fontSize: "26px",
  fontWeight: 800,
  lineHeight: 1.2,
  margin: "0 0 8px",
};

const paragraph = {
  color: "#685d4f",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const divider = {
  borderColor: "#e9e2d5",
  margin: "24px 0",
};

const label = {
  color: "#8a7b68",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  margin: "16px 0 4px",
  textTransform: "uppercase",
};

const value = {
  color: "#2b2118",
  fontSize: "15px",
  lineHeight: "26px",
  margin: "0",
  whiteSpace: "pre-wrap",
};

const footer = {
  color: "#a89a86",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "16px 0 0",
};