import { useState } from "react";
import {
  Button,
  Input,
  EmptyState,
  Loading,
  ButtonTrigger,
  ResourceCard,
  FeatureCover,
  ShaderBackground,
  OTPInput,
  ToggleGroup,
  Menu,
  MenuItem,
} from "@components/primitives";
import { Icon } from "@Icons";
import type { IconComponent } from "@Icons";
import * as IconSet from "@components/primitives/Icons/Icons";
import { ComponentShowcase } from "./ComponentShowcase";
import {
  CVSelector,
  VerseBlock,
  ChapterBlock,
  TextSelectionToolbar,
} from "@components/bible";
import { Check, Search, Bible, Notes, Settings } from "@Icons";

const ALL_ICONS = Object.entries(IconSet) as [string, IconComponent][];

const MOCK_VERSES = [
  { id: 1, number: 1, text: "In the beginning God created the heaven and the earth.", chapter_id: 1, book_id: 1 },
  { id: 2, number: 2, text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.", chapter_id: 1, book_id: 1 },
  { id: 3, number: 3, text: "And God said, Let there be light: and there was light.", chapter_id: 1, book_id: 1 },
  { id: 4, number: 4, text: "And God saw the light, that it was good: and God divided the light from the darkness.", chapter_id: 1, book_id: 1 },
  { id: 5, number: 5, text: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.", chapter_id: 1, book_id: 1 },
];

export function UILibrary() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [menuOpen, setMenuOpen] = useState(false);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [toggleValue, setToggleValue] = useState("bible");
  const [cvSelected, setCvSelected] = useState<number | null>(3);
  const [activeEmoji, setActiveEmoji] = useState<string>("");

  return (
    <div className="h-screen overflow-y-auto pb-24 space-y-10 bg-white text-text-primary">
      <div className="flex items-center sticky top-0 z-10 justify-between w-full max-w-5xl mx-auto py-2">
        <h1 className="text-xl font-medium">UI Library</h1>
        <Button variant="primary" size="sm" icon={Search}>Search</Button>
      </div>

      {/* ── BUTTON ─────────────────────────────────────────────────────────── */}
      <ComponentShowcase id="button" title="Button">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button icon={Check} variant="primary">Primary</Button>
          <Button icon={Check} variant="brand">Brand</Button>
          <Button icon={Check} variant="secondary">Secondary</Button>
          <Button icon={Check} variant="ghost">Ghost</Button>
        </div>
      </ComponentShowcase>

      {/* ── TOGGLE GROUP ───────────────────────────────────────────────────── */}
      <ComponentShowcase id="toggle-group" title="ToggleGroup">
        <div className="flex flex-col items-center gap-6">
          <ToggleGroup
            variant="toggle"
            value={toggleValue}
            onChange={setToggleValue}
            options={[
              { icon: Bible, label: "Bible", value: "bible" },
              { icon: Notes, label: "Notes", value: "notes" },
            ]}
          />
          <ToggleGroup
            variant="toggle"
            value={toggleValue}
            onChange={setToggleValue}
            options={[
              { icon: Bible, label: "Bible", value: "bible" },
              { icon: Notes, label: "Notes", value: "notes" },
            ]}
          />
          <ToggleGroup
            variant="toggle"
            iconOnly
            value={toggleValue}
            onChange={setToggleValue}
            options={[
              { icon: Bible, value: "bible" },
              { icon: Notes, value: "notes" },
              { icon: Settings, value: "settings" },
            ]}
          />
        </div>
      </ComponentShowcase>

      {/* ── BUTTON TRIGGER ─────────────────────────────────────────────────── */}
      <ComponentShowcase id="button-trigger" title="ButtonTrigger">
        <div className="flex items-center gap-4">
          <ButtonTrigger open={false} onClick={() => {}}>Genesis 1</ButtonTrigger>
          <ButtonTrigger open={true} onClick={() => {}}>Genesis 1</ButtonTrigger>
          <ButtonTrigger open={triggerOpen} onClick={() => setTriggerOpen(v => !v)} width={140}>
            KJV
          </ButtonTrigger>
        </div>
      </ComponentShowcase>

      {/* ── INPUT ──────────────────────────────────────────────────────────── */}
      <ComponentShowcase id="input" title="Input">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <Input id="input-default" label="Label" placeholder="Placeholder" />
          <Input id="input-error" label="Email" placeholder="you@example.com" error="Please enter a valid email address" />
          <Input id="input-disabled" label="Disabled" placeholder="Disabled" disabled />
        </div>
      </ComponentShowcase>

      {/* ── OTP INPUT ──────────────────────────────────────────────────────── */}
      <ComponentShowcase id="otp" title="OTPInput">
        <div className="flex flex-col items-center gap-6">
          <OTPInput value={otp} onChange={setOtp} onComplete={(token) => console.log("OTP:", token)} />
          <OTPInput value={otp} onChange={setOtp} error />
        </div>
      </ComponentShowcase>

      {/* ── MENU ───────────────────────────────────────────────────────────── */}
      <ComponentShowcase id="menu" title="Menu & MenuItem">
        <div className="flex items-start gap-8">
          <Menu>
            <MenuItem label="Open book" icon={Bible} onClick={() => {}} />
            <MenuItem label="Search" icon={Search} onClick={() => {}} />
            <MenuItem label="Settings" icon={Settings} onClick={() => {}} selected />
            <MenuItem label="Delete" danger onClick={() => {}} />
            <MenuItem label="Disabled" disabled onClick={() => {}} />
          </Menu>
          <div className="relative">
            <ButtonTrigger open={menuOpen} onClick={() => setMenuOpen(v => !v)}>Options</ButtonTrigger>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute left-0 top-[calc(100%+4px)] z-50">
                  <Menu>
                    <MenuItem label="Old Testament" onClick={() => setMenuOpen(false)} selected />
                    <MenuItem label="New Testament" onClick={() => setMenuOpen(false)} />
                  </Menu>
                </div>
              </>
            )}
          </div>
        </div>
      </ComponentShowcase>

      {/* ── RESOURCE CARD ──────────────────────────────────────────────────── */}
      <ComponentShowcase id="resource-card" title="ResourceCard">
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <ResourceCard abbr="KJV" title="King James Version" subtitle="Public Domain" isSelected onSelect={() => {}} onDownload={() => {}} onRemove={() => {}} isLocal />
          <ResourceCard abbr="NIV" title="New International Version" subtitle="Commercial" onSelect={() => {}} onDownload={() => {}} onRemove={() => {}} />
          <ResourceCard abbr="ESV" title="English Standard Version" subtitle="Open License" onSelect={() => {}} onDownload={() => {}} onRemove={() => {}} isLocal />
          <ResourceCard abbr="MSG" title="The Message" subtitle="Eugene Peterson" variant="elevated" onSelect={() => {}} onDownload={() => {}} onRemove={() => {}} />
        </div>
      </ComponentShowcase>

      {/* ── EMPTY STATE ────────────────────────────────────────────────────── */}
      <ComponentShowcase id="empty-state" title="EmptyState">
        <div className="flex flex-row items-center justify-center gap-4">
          <EmptyState icon={Bible} title="No books here" description="No books found for this category." />
          <EmptyState icon={Search} title="No results" description="Try a different search term." action={{ label: "Clear search", onClick: () => {} }} />
        </div>
      </ComponentShowcase>

      {/* ── LOADING ────────────────────────────────────────────────────────── */}
      <ComponentShowcase id="loading" title="Loading">
        <Loading />
      </ComponentShowcase>

      {/* ── FEATURE COVER ──────────────────────────────────────────────────── */}
      <ComponentShowcase id="feature-cover" title="FeatureCover — Bible">
        <div className="flex flex-wrap items-end gap-6">
          <FeatureCover type="bible" size="sm" title="Genesis" />
          <FeatureCover type="bible" size="sm" title="Deuteronomy" abbreviation="Deut" />
          <FeatureCover type="bible" size="md" title="Psalms" />
          <FeatureCover type="bible" size="lg" title="Genesis" />
        </div>
      </ComponentShowcase>

      <ComponentShowcase id="feature-cover-note" title="FeatureCover — Note">
        <div className="flex flex-wrap items-end gap-6">
          <FeatureCover type="note" size="xs" title="Quick Note" />
          <FeatureCover type="note" size="sm" title="Quick Note" subtitle="Updated 2 days ago" />
          <FeatureCover type="note" size="md" title="Study Notes" subtitle="Updated today" />
          <FeatureCover type="note" size="lg" title="Deep Study Notes" subtitle="Updated 3 days ago" />
        </div>
      </ComponentShowcase>

      {/* ── SHADER BACKGROUND ──────────────────────────────────────────────── */}
      <ComponentShowcase id="shader" title="ShaderBackground" flush>
        <div className="relative w-full h-64">
          <ShaderBackground />
        </div>
      </ComponentShowcase>


      {/* ── CV SELECTOR ────────────────────────────────────────────────────── */}
      <ComponentShowcase id="cv-selector" title="CVSelector">
        <div className="flex flex-wrap items-start gap-8">
          <CVSelector
            title="Chapters"
            variant="lg"
            items={Array.from({ length: 24 }, (_, i) => i + 1)}
            selected={cvSelected}
            onSelect={setCvSelected}
          />
          <CVSelector
            title="Chapters"
            variant="md"
            items={Array.from({ length: 24 }, (_, i) => i + 1)}
            selected={cvSelected}
            onSelect={setCvSelected}
            collapsible
            defaultCollapsed
          />
          <CVSelector
            title="Verses"
            variant="md"
            plain
            items={Array.from({ length: 31 }, (_, i) => i + 1)}
            selected={cvSelected}
            onSelect={setCvSelected}
          />
        </div>
      </ComponentShowcase>

      {/* ── VERSE BLOCK ────────────────────────────────────────────────────── */}
      <ComponentShowcase id="verse-block" title="VerseBlock">
        <div className="flex flex-col gap-2 w-full max-w-2xl">
          <VerseBlock number={1} text="In the beginning God created the heaven and the earth." highlights={[]} />
          <VerseBlock
            number={2}
            text="And the earth was without form, and void; and darkness was upon the face of the deep."
            highlights={[{ start: 4, end: 13, color: "yellow" }]}
          />
          <VerseBlock number={3} text="And God said, Let there be light: and there was light." highlights={[]} hasNote />
        </div>
      </ComponentShowcase>

      {/* ── CHAPTER BLOCK ──────────────────────────────────────────────────── */}
      <ComponentShowcase id="chapter-block-loading" title="ChapterBlock — Loading">
        <ChapterBlock bookId={1} chapterNumber={1} verses={[]} isLoading />
      </ComponentShowcase>

      <ComponentShowcase id="chapter-block" title="ChapterBlock — Loaded">
        <ChapterBlock bookId={1} chapterNumber={1} verses={MOCK_VERSES} isActive />
      </ComponentShowcase>

      {/* ── TEXT SELECTION TOOLBAR ─────────────────────────────────────────── */}
      <ComponentShowcase id="text-selection-toolbar" title="TextSelectionToolbar">
        <div className="flex items-center justify-center py-4">
          <TextSelectionToolbar
            activeColor={null}
            onHighlight={() => {}}
            onSaveNote={() => {}}
            onClose={() => {}}
          />
        </div>
      </ComponentShowcase>

      {/* ── ICONS ──────────────────────────────────────────────────────────── */}
      <ComponentShowcase id="icons" title="Icons">
        <div className="grid w-full grid-cols-6 place-items-center gap-4">
          {ALL_ICONS.map(([name, IconComp]) => (
            <div key={name} className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center w-16 h-16 bg-surface-1 border border-border-gray-1 rounded-lg">
                <Icon icon={IconComp} color="muted" size={16} />
              </div>
              <span className="text-xs font-medium text-text-primary">{name}</span>
            </div>
          ))}
        </div>
      </ComponentShowcase>
    </div>
  );
}
