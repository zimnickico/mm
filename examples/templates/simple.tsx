import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
} from "@react-email/components";
import { Markdown } from "@react-email/markdown";

type Props = {
  subject: string;
  markdown: string;
  meta?: Record<string, any>;
  file?: string;
};

export default function BasicTemplate({ subject, markdown }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Markdown>{markdown}</Markdown>
          </Section>
          <Section>
            <Text style={footer}>Sent with M(arkdown)M(ailer)</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#111111",
  fontFamily: "Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "24px 16px",
  maxWidth: "600px",
};

const title: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 16px",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#666",
  marginTop: "24px",
};
