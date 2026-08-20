"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PartySuggestion {
  name: string;
  gst: string;
}

interface PartyAutocompleteProps {
  role: "consignor" | "consignee";
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (name: string, gst: string) => void;
  placeholder?: string;
}

export function PartyAutocomplete({
  role,
  value,
  onChange,
  onSelectSuggestion,
  placeholder
}: PartyAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PartySuggestion[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/shipments/parties?q=${encodeURIComponent(q)}&role=${role}`);
        if (!cancelled) {
          setSuggestions(data.data || []);
          setOpen(true);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, role]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (value.trim() && suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg pr-9"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.name}
              onClick={() => {
                onSelectSuggestion(s.name, s.gst || "");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-2"
            >
              <span className="truncate">{s.name}</span>
              {s.gst && <span className="shrink-0 font-mono text-xs text-slate-400">{s.gst}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
