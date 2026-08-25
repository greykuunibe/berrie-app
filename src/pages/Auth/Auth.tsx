import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShaderBackground } from "@components/primitives/ShaderBackground";
import { Button } from "@components/primitives";
import { Input } from "@components/primitives";
import { OTPInput } from "@components/primitives";
import { Mail, ChevronLeft, ChevronRight } from "@Icons";
import { supabase } from "@/lib/supabase";

type Step = "welcome" | "email" | "otp" | "name";

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("429") || m.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("invalid email") || m.includes("unable to validate"))
    return "Please enter a valid email address.";
  if (m.includes("expired") || m.includes("invalid otp") || m.includes("token"))
    return "That code is invalid or expired. Please request a new one.";
  if (m.includes("network") || m.includes("fetch"))
    return "Connection error. Check your internet and try again.";
  return "Something went wrong. Please try again.";
}

export function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Prevents double-execution when both form onSubmit and button onAction fire
  const inFlightRef = useRef(false);

  const goBack = () => {
    setError(null);
    if (step === "email") setStep("welcome");
    if (step === "otp") { setOtp(["", "", "", "", "", ""]); setStep("email"); }
    if (step === "name") setStep("otp");
  };

  async function sendOtp() {
    if (inFlightRef.current) return;
    if (!email.trim()) throw new Error("Enter your email first");
    inFlightRef.current = true;
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) { setError(friendlyAuthError(error.message)); throw error; }
      setTimeout(() => setStep("otp"), 500);
    } finally {
      inFlightRef.current = false;
    }
  }

  async function verifyOtp(token: string) {
    setError(null);
    const { error, data } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) { setError(friendlyAuthError(error.message)); setOtp(["", "", "", "", "", ""]); return; }

    // Check if user already has a profile (returning user)
    if (data.user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, full_name")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.full_name) {
        // Returning user — skip name step
        setTimeout(() => navigate("/app"), 400);
        return;
      }
    }

    // New user — collect name
    setTimeout(() => setStep("name"), 400);
  }

  async function saveName() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_profiles")
          .upsert({ id: user.id, full_name: `${firstName} ${lastName}`.trim() });
      }
      setTimeout(() => navigate("/app"), 500);
    } finally {
      inFlightRef.current = false;
    }
  }

  const footerLink = (
    <p className="text-sm text-text-primary text-center">
      See how we <span className="underline cursor-pointer">handle</span> your data.
    </p>
  );

  const backButton = (
    <Button variant="primary" size="sm" icon={ChevronLeft} iconPosition="left" onClick={goBack}>
      Go back
    </Button>
  );

  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden">
      <div className="relative flex-1">
        <ShaderBackground className="absolute inset-0" />

        <div className="relative z-10 flex items-center justify-center h-full">
          <div
            className="relative flex flex-col items-center justify-center bg-surface-1 border border-border-gray-1 card-shadow rounded-2xl overflow-hidden"
            style={{ width: 500, minHeight: 520, padding: "64px 32px" }}
          >

            {/* STEP 1 — Welcome */}
            {step === "welcome" && (
              <div className="flex flex-col items-center gap-16 w-full">
                <div className="flex flex-col items-center gap-2">
                  <h1 className="text-2xl font-medium leading-none text-text-primary text-center">
                    Shalom, Welcome to Berrie
                  </h1>
                  <p className="text-sm text-text-primary text-center">
                    How would you like to continue?
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4" style={{ width: 200 }}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={Mail}
                    iconPosition="left"
                    isFullWidth
                    onClick={() => setStep("email")}
                  >
                    Continue with email
                  </Button>
                  <Button
                    variant="brand"
                    size="md"
                    icon={ChevronRight}
                    iconPosition="right"
                    isFullWidth
                    onClick={() => navigate("/app")}
                  >
                    Skip to app
                  </Button>
                </div>

                {footerLink}
              </div>
            )}

            {/* STEP 2 — Email */}
            {step === "email" && (
              <form
                className="flex px-8 flex-col w-full gap-16"
                onSubmit={(e) => { e.preventDefault(); sendOtp(); }}
              >
                <div className="absolute top-6 left-6">{backButton}</div>

                <div className="flex flex-col items-center gap-2">
                  <h1 className="text-2xl font-medium leading-none text-text-primary text-center">
                    Create an account
                  </h1>
                  <p className="text-sm text-text-primary text-center">
                    Please confirm your email
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error ?? undefined}
                    autoFocus
                    required
                  />
                  <Button
                    type="submit"
                    variant="brand"
                    size="md"
                    isFullWidth
                    onAction={sendOtp}
                  >
                    Continue
                  </Button>
                </div>

                {footerLink}
              </form>
            )}

            {/* STEP 3 — OTP */}
            {step === "otp" && (
              <div className="flex flex-col w-full px-8 gap-16">
                <div className="absolute top-6 left-6">{backButton}</div>

                <div className="flex flex-col items-center gap-2">
                  <h1
                    className="text-2xl font-medium leading-tight text-text-primary text-center"
                    style={{ maxWidth: 380 }}
                  >
                    Please enter the code sent to{" "}
                    <span className="break-all underline">{email}</span>
                  </h1>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    onComplete={verifyOtp}
                    error={!!error}
                    autoFocus
                  />

                  {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm text-text-primary">Didn't receive the email?</p>
                    <p className="text-xs text-text-muted">Check your spam folder</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 — Name (new users only) */}
            {step === "name" && (
              <form
                className="flex flex-col w-full gap-16"
                onSubmit={(e) => { e.preventDefault(); saveName(); }}
              >
                <div className="flex flex-col items-center gap-2">
                  <h1 className="text-[32px] font-medium leading-none text-text-primary text-center">
                    What is your name?
                  </h1>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <Input
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                    required
                  />
                  <Input
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    variant="brand"
                    size="md"
                    isFullWidth
                    onAction={saveName}
                  >
                    Continue
                  </Button>
                </div>

                {footerLink}
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
