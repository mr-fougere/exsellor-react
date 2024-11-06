import { useEffect, useState, useRef } from "react";
import CredentialKeeper from "../../services/CredentialKeeper";
import PinDisplay from "../reusable/PinDisplay";
import { useNavigate } from "react-router-dom";

type PinFormProps = {
  credentialKeeper: CredentialKeeper;
  length?: number;
};

export const PinForm = ({ credentialKeeper, length = 4 }: PinFormProps) => {
  const [remainingPinTest, setRemainingPinTest] = useState<number>(
    credentialKeeper.remainingPinTest
  );
  const navigate = useNavigate();
  const pinRef = useRef<string[]>([]);
  const [pinDisplay, setPinDisplay] = useState<string[]>([]);

  const handleKeyUp = (e: KeyboardEvent) => {
    if (pinRef.current.length < length && e.key >= "0" && e.key <= "9") {
      pinRef.current = [...pinRef.current, e.key];
      setPinDisplay([...pinRef.current]);
    } else if (e.key === "Backspace" && pinRef.current.length > 0) {
      pinRef.current = pinRef.current.slice(0, -1);
      setPinDisplay([...pinRef.current]);
    }
  };

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleValidLengthPin = async () => {
    if (pinRef.current.length === length) {
      await credentialKeeper.testPin(pinRef.current.join("")).then((result) => {
        if (result) {
          navigate("/sellsy/exports");
          console.log("Pin correct");
        } else {
          setRemainingPinTest(credentialKeeper.remainingPinTest);
        }
        pinRef.current = [];
        setPinDisplay([]);
      });
    }
  };

  useEffect(() => {
    handleValidLengthPin();
  }, [pinDisplay]);

  useEffect(() => {
    window.focus();
  }, []);

  const handleResetCreds = async () => {
    await credentialKeeper.reset();
  };

  return (
    <div className="flex flex-col justify-center p-4 items-center">
      <PinDisplay pin={pinDisplay} length={length}></PinDisplay>
      <div className="mt-2">
        Tentatives restantes avant reset: {remainingPinTest}
      </div>
      <div>
        <button
          className="w-max inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2 "
          onClick={handleResetCreds}
        >
          Réinitialiser mes identifiants
        </button>
      </div>
    </div>
  );
};
