"use client";

import { useCallback, useRef, useState } from "react";
import { Plus, X, GripVertical, Image, Type, MousePointer, Braces, Link as LinkIcon, Settings, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const inp =
  "w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

interface QuickReply {
  title: string;
  payload: string;
}

interface Button {
  title: string;
  type: "postback" | "url";
  payload?: string;
  url?: string;
}

interface CarouselElement {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  buttons?: Button[];
}

interface Carousel {
  elements: CarouselElement[];
}

interface Message {
  text?: string;
  imageUrl?: string;
  // Media attachment. mediaType + mediaUrl supersede the legacy image-only imageUrl
  // and let a message send an image, video, or audio file.
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio";
  quickReplies?: QuickReply[];
  buttons?: Button[];
  carousel?: Carousel;
}

interface SendMessagePanelData {
  messages?: Message[];
  [key: string]: unknown;
}

interface SendMessagePanelProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  availableVariables?: string[];
}

function VariablePicker({
  variables,
  onInsert,
}: {
  variables: string[];
  onInsert: (variable: string) => void;
}) {
  return (
    <div className="mt-1.5">
      <p className="text-[11px] text-muted-foreground/60">
        Haz clic para insertar una variable. Rutas con puntos como {"{{myvar.data.name}}"} leen
        campos de respuestas JSON.
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {variables.map((variable) => (
          <button
            key={variable}
            type="button"
            onClick={() => onInsert(variable)}
            className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-blue-500 hover:bg-blue-50"
          >
            {`{{${variable}}}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SendMessagePanel({ data: rawData, onChange, availableVariables }: SendMessagePanelProps) {
  const data = rawData as SendMessagePanelData;
  const messages = data.messages || [];

  const updateMessage = useCallback(
    (index: number, updated: Message) => {
      const msgs = [...messages];
      msgs[index] = updated;
      onChange({ ...data, messages: msgs });
    },
    [data, messages, onChange]
  );

  const addMessage = useCallback(() => {
    onChange({ ...data, messages: [...messages, { text: "" }] });
  }, [data, messages, onChange]);

  const removeMessage = useCallback(
    (index: number) => {
      onChange({ ...data, messages: messages.filter((_, i) => i !== index) });
    },
    [data, messages, onChange]
  );

  return (
    <div className="space-y-4">
      {messages.map((message, msgIndex) => (
        <MessageEditor
          key={msgIndex}
          index={msgIndex}
          message={message}
          onChange={(updated) => updateMessage(msgIndex, updated)}
          onRemove={() => removeMessage(msgIndex)}
          canRemove={messages.length > 1}
          availableVariables={availableVariables}
        />
      ))}

      <button
        type="button"
        onClick={addMessage}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-blue-400 hover:text-blue-500"
      >
        <Plus className="h-4 w-4" />
        Añadir mensaje
      </button>

      {messages.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Añade al menos un mensaje para enviar.
        </p>
      )}

      {/* Platform hints */}
      <details className="rounded-lg border border-border bg-muted p-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Notas por plataforma</summary>
        <ul className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
          <li>Facebook/Instagram/WhatsApp: máximo 3 botones por mensaje</li>
          <li>Telegram: los botones aparecen como teclados en línea</li>
          <li>Las respuestas rápidas desaparecen cuando el usuario responde</li>
          <li>Carruseles: nativos en Facebook/Instagram, texto alternativo en el resto</li>
          <li>
            WhatsApp: Meta solo acepta mensajes de texto libre dentro de las 24 h del
            último mensaje del contacto
          </li>
        </ul>
      </details>
    </div>
  );
}

function MessageEditor({
  index,
  message,
  onChange,
  onRemove,
  canRemove,
  availableVariables,
}: {
  index: number;
  message: Message;
  onChange: (m: Message) => void;
  onRemove: () => void;
  canRemove: boolean;
  availableVariables?: string[];
}) {
  const isCarouselMode = !!message.carousel;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [varsOpen, setVarsOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [openButton, setOpenButton] = useState<number | null>(null);
  const [openReply, setOpenReply] = useState<number | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  const insertVariable = useCallback(
    (variable: string) => {
      const token = `{{${variable}}}`;
      const textarea = textareaRef.current;
      const text = message.text || "";
      const caret = textarea?.selectionStart ?? text.length;
      onChange({
        ...message,
        text: text.slice(0, caret) + token + text.slice(caret),
      });
      // Restore focus and place the caret after the inserted token
      requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(caret + token.length, caret + token.length);
      });
    },
    [message, onChange]
  );

  const toggleMode = useCallback(() => {
    if (isCarouselMode) {
      // Switch to text mode: remove carousel
      const { carousel: _, ...rest } = message;
      onChange({ ...rest, text: rest.text || "" });
    } else {
      // Switch to carousel mode: remove text-mode fields, add empty carousel
      onChange({
        carousel: {
          elements: [{ title: "", subtitle: "", imageUrl: "" }],
        },
      });
    }
  }, [isCarouselMode, message, onChange]);

  // Quick replies
  const addQuickReply = useCallback(() => {
    const replies = message.quickReplies || [];
    onChange({ ...message, quickReplies: [...replies, { title: "", payload: "" }] });
  }, [message, onChange]);

  const updateQuickReply = useCallback(
    (i: number, updated: QuickReply) => {
      const replies = [...(message.quickReplies || [])];
      replies[i] = updated;
      onChange({ ...message, quickReplies: replies });
    },
    [message, onChange]
  );

  const removeQuickReply = useCallback(
    (i: number) => {
      const replies = (message.quickReplies || []).filter((_, idx) => idx !== i);
      onChange({ ...message, quickReplies: replies.length > 0 ? replies : undefined });
    },
    [message, onChange]
  );

  // Buttons
  const updateButton = useCallback(
    (i: number, updated: Button) => {
      const buttons = [...(message.buttons || [])];
      buttons[i] = updated;
      onChange({ ...message, buttons });
    },
    [message, onChange]
  );

  const removeButton = useCallback(
    (i: number) => {
      const buttons = (message.buttons || []).filter((_, idx) => idx !== i);
      onChange({ ...message, buttons: buttons.length > 0 ? buttons : undefined });
    },
    [message, onChange]
  );

  const buttons = message.buttons || [];
  const replies = message.quickReplies || [];
  const mediaValue = message.mediaUrl ?? message.imageUrl ?? "";
  const hasMedia = mediaOpen || !!mediaValue;
  const textLength = (message.text || "").length;

  const addTypedButton = (type: "url" | "postback") => {
    onChange({
      ...message,
      buttons: [
        ...buttons,
        type === "url" ? { title: "", type: "url", url: "" } : { title: "", type: "postback", payload: "" },
      ],
    });
    setOpenButton(buttons.length);
    setAddMenuOpen(false);
  };

  const blockCard =
    "flex w-full items-start gap-3 rounded-xl border-2 border-dashed border-border p-3 text-left transition-colors hover:border-blue-400";

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Message header */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-xs font-semibold text-muted-foreground">Mensaje {index + 1}</span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3 p-3">
        {isCarouselMode ? (
          <>
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs font-medium text-blue-500 hover:underline"
            >
              ← Volver a mensaje de texto
            </button>
            <CarouselEditor
              carousel={message.carousel!}
              onChange={(carousel) => onChange({ ...message, carousel })}
            />
          </>
        ) : (
          <>
            {/* Media attached to this message */}
            {hasMedia && (
              <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Image className="h-3 w-3" /> Archivo adjunto
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaOpen(false);
                      onChange({ ...message, mediaUrl: undefined, imageUrl: undefined });
                    }}
                    className="rounded p-1 text-muted-foreground/60 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={message.mediaType || "image"}
                    onChange={(e) =>
                      onChange({ ...message, mediaType: e.target.value as "image" | "video" | "audio" })
                    }
                    className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
                  >
                    <option value="image">Imagen</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                  <input
                    type="url"
                    value={mediaValue}
                    onChange={(e) =>
                      onChange({
                        ...message,
                        mediaUrl: e.target.value || undefined,
                        mediaType: message.mediaType || "image",
                        imageUrl: undefined,
                      })
                    }
                    placeholder="https://example.com/file.jpg"
                    className={inp}
                  />
                </div>
              </div>
            )}

            {/* Chat bubble: text + buttons */}
            <div className="overflow-hidden rounded-2xl bg-muted">
              <div className="px-3 pt-3">
                <textarea
                  ref={textareaRef}
                  value={message.text || ""}
                  onChange={(e) => onChange({ ...message, text: e.target.value })}
                  placeholder="Escribe tu mensaje…"
                  rows={6}
                  className="w-full resize-y bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <div className="flex items-center justify-between pb-2 text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setVarsOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-1 rounded px-1.5 py-0.5 font-medium hover:bg-card",
                      varsOpen && "bg-card text-blue-500"
                    )}
                    title="Insertar variable"
                  >
                    <Braces className="h-3.5 w-3.5" /> Variable
                  </button>
                  <span>{textLength}/1000</span>
                </div>
                {varsOpen && (
                  <div className="pb-2">
                    {availableVariables && availableVariables.length > 0 ? (
                      <VariablePicker variables={availableVariables} onInsert={insertVariable} />
                    ) : (
                      <p className="text-[11px] text-muted-foreground/60">
                        Usa {"{{variable}}"} para contenido dinámico
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Buttons inside the bubble */}
              <div className="space-y-2 px-3 pb-3">
                {buttons.map((btn, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      {btn.type === "url" && <LinkIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
                      <input
                        type="text"
                        value={btn.title}
                        onChange={(e) => updateButton(i, { ...btn, title: e.target.value })}
                        placeholder="Título del botón"
                        className="min-w-0 flex-1 bg-transparent text-center text-sm font-medium text-blue-600 placeholder:text-muted-foreground/50 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setOpenButton(openButton === i ? null : i)}
                        className={cn(
                          "rounded p-1 text-muted-foreground hover:bg-muted",
                          openButton === i && "text-blue-500"
                        )}
                        title="Configurar"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeButton(i);
                          setOpenButton(null);
                        }}
                        className="rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {openButton === i && (
                      <div className="space-y-2 border-t border-border bg-muted/40 p-2">
                        <select
                          value={btn.type}
                          onChange={(e) => {
                            const type = e.target.value as "postback" | "url";
                            updateButton(i, {
                              ...btn,
                              type,
                              payload: type === "postback" ? btn.payload || "" : undefined,
                              url: type === "url" ? btn.url || "" : undefined,
                            });
                          }}
                          className={inp}
                        >
                          <option value="url">Abrir sitio web</option>
                          <option value="postback">Enviar al siguiente paso (postback)</option>
                        </select>
                        {btn.type === "postback" ? (
                          <input
                            type="text"
                            value={btn.payload || ""}
                            onChange={(e) => updateButton(i, { ...btn, payload: e.target.value })}
                            placeholder="Valor del payload"
                            className={inp}
                          />
                        ) : (
                          <input
                            type="url"
                            value={btn.url || ""}
                            onChange={(e) => updateButton(i, { ...btn, url: e.target.value })}
                            placeholder="https://..."
                            className={inp}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {buttons.length < 3 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAddMenuOpen((o) => !o)}
                      className="w-full rounded-xl border-2 border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-blue-400 hover:text-blue-500"
                    >
                      + Añadir botón
                    </button>
                    {addMenuOpen && (
                      <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                        <button
                          type="button"
                          onClick={() => addTypedButton("url")}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <LinkIcon className="h-4 w-4 text-blue-500" /> Abrir sitio web
                        </button>
                        <button
                          type="button"
                          onClick={() => addTypedButton("postback")}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <Plus className="h-4 w-4 text-blue-500" /> Siguiente paso (postback)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick replies as pills under the bubble */}
            <div className="flex flex-col items-end gap-2">
              {replies.map((qr, i) => (
                <div key={i} className="w-full max-w-[85%]">
                  <div className="flex items-center gap-1 rounded-full border border-blue-500 bg-card pl-3 pr-1">
                    <input
                      type="text"
                      value={qr.title}
                      onChange={(e) => updateQuickReply(i, { ...qr, title: e.target.value })}
                      placeholder="Respuesta"
                      className="min-w-0 flex-1 bg-transparent py-1.5 text-center text-sm font-medium text-blue-600 placeholder:text-muted-foreground/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setOpenReply(openReply === i ? null : i)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                      title="Configurar"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeQuickReply(i);
                        setOpenReply(null);
                      }}
                      className="rounded-full p-1.5 text-muted-foreground/60 hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {openReply === i && (
                    <input
                      type="text"
                      value={qr.payload}
                      onChange={(e) => updateQuickReply(i, { ...qr, payload: e.target.value })}
                      placeholder="Payload"
                      className={cn(inp, "mt-1.5")}
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  addQuickReply();
                  setOpenReply(replies.length);
                }}
                className="rounded-full border-2 border-dashed border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-blue-400 hover:text-blue-500"
              >
                + Añadir respuesta inmediata
              </button>
            </div>

            {/* Content blocks */}
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Añade uno de los bloques de contenido:</p>
              {!hasMedia && (
                <button type="button" onClick={() => setMediaOpen(true)} className={blockCard}>
                  <Image className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-sm font-medium text-foreground">Imagen / video / audio</span>
                    <span className="block text-xs text-muted-foreground">
                      Aumenta la participación con elementos visuales
                    </span>
                  </span>
                </button>
              )}
              <button type="button" onClick={toggleMode} className={blockCard}>
                <LayoutGrid className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <span>
                  <span className="block text-sm font-medium text-foreground">Carrusel</span>
                  <span className="block text-xs text-muted-foreground">
                    Tarjetas deslizables con imagen y botones
                  </span>
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CarouselEditor({
  carousel,
  onChange,
}: {
  carousel: Carousel;
  onChange: (c: Carousel) => void;
}) {
  const elements = carousel.elements || [];

  const addCard = useCallback(() => {
    onChange({
      elements: [...elements, { title: "", subtitle: "", imageUrl: "" }],
    });
  }, [elements, onChange]);

  const updateCard = useCallback(
    (i: number, updated: CarouselElement) => {
      const els = [...elements];
      els[i] = updated;
      onChange({ elements: els });
    },
    [elements, onChange]
  );

  const removeCard = useCallback(
    (i: number) => {
      onChange({ elements: elements.filter((_, idx) => idx !== i) });
    },
    [elements, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="h-3 w-3 text-muted-foreground/60" />
          <label className="text-xs font-medium text-muted-foreground">
            Tarjetas ({elements.length})
          </label>
        </div>
        <button
          type="button"
          onClick={addCard}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-blue-500 hover:bg-blue-50"
        >
          <Plus className="h-3 w-3" />
          Añadir tarjeta
        </button>
      </div>

      {elements.map((el, i) => (
        <CarouselCardEditor
          key={i}
          index={i}
          element={el}
          onChange={(updated) => updateCard(i, updated)}
          onRemove={() => removeCard(i)}
          canRemove={elements.length > 1}
        />
      ))}

      {elements.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Añade al menos una tarjeta al carrusel.
        </p>
      )}
    </div>
  );
}

function CarouselCardEditor({
  index,
  element,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  element: CarouselElement;
  onChange: (el: CarouselElement) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const buttons = element.buttons || [];

  const addLinkButton = useCallback(() => {
    if (buttons.length >= 3) return;
    onChange({ ...element, buttons: [...buttons, { title: "", type: "url", url: "" }] });
  }, [element, buttons, onChange]);

  const addButton = useCallback(() => {
    if (buttons.length >= 3) return;
    onChange({
      ...element,
      buttons: [...buttons, { title: "", type: "postback", payload: "" }],
    });
  }, [element, buttons, onChange]);

  const updateButton = useCallback(
    (i: number, updated: Button) => {
      const btns = [...buttons];
      btns[i] = updated;
      onChange({ ...element, buttons: btns });
    },
    [element, buttons, onChange]
  );

  const removeButton = useCallback(
    (i: number) => {
      const btns = buttons.filter((_, idx) => idx !== i);
      onChange({ ...element, buttons: btns.length > 0 ? btns : undefined });
    },
    [element, buttons, onChange]
  );

  return (
    <div className="rounded-lg border border-border bg-muted p-2.5">
      {/* Card header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Tarjeta {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-0.5 text-muted-foreground/60 hover:bg-accent hover:text-muted-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Image URL */}
        <div>
          <div className="mb-1 flex items-center gap-1">
            <Image className="h-2.5 w-2.5 text-muted-foreground/60" />
            <label className="text-[11px] font-medium text-muted-foreground">URL de la imagen</label>
          </div>
          <input
            type="url"
            value={element.imageUrl || ""}
            onChange={(e) =>
              onChange({ ...element, imageUrl: e.target.value || undefined })
            }
            placeholder="https://example.com/image.png"
            className="w-full rounded border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Título
          </label>
          <input
            type="text"
            value={element.title}
            onChange={(e) => onChange({ ...element, title: e.target.value })}
            placeholder="Título de la tarjeta (máx. 80 caracteres)"
            maxLength={80}
            className="w-full rounded border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Subtítulo
          </label>
          <input
            type="text"
            value={element.subtitle || ""}
            onChange={(e) =>
              onChange({ ...element, subtitle: e.target.value || undefined })
            }
            placeholder="Subtítulo de la tarjeta"
            className="w-full rounded border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <MousePointer className="h-2.5 w-2.5 text-muted-foreground/60" />
              <label className="text-[11px] font-medium text-muted-foreground">
                Botones ({buttons.length}/3)
              </label>
            </div>
            {buttons.length < 3 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={addLinkButton}
                  className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-blue-500 hover:bg-blue-50"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Añadir enlace
                </button>
                <button
                  type="button"
                  onClick={addButton}
                  className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-blue-500 hover:bg-blue-50"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Añadir
                </button>
              </div>
            )}
          </div>
          {buttons.map((btn, i) => (
            <div
              key={i}
              className="mb-1.5 rounded border border-border bg-card p-2"
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <input
                  type="text"
                  value={btn.title}
                  onChange={(e) =>
                    updateButton(i, { ...btn, title: e.target.value })
                  }
                  placeholder="Etiqueta del botón"
                  className="flex-1 rounded border border-border bg-card px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeButton(i)}
                  className="rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={btn.type}
                  onChange={(e) => {
                    const type = e.target.value as "postback" | "url";
                    updateButton(i, {
                      ...btn,
                      type,
                      payload:
                        type === "postback" ? btn.payload || "" : undefined,
                      url: type === "url" ? btn.url || "" : undefined,
                    });
                  }}
                  className="rounded border border-border bg-card px-1.5 py-1 text-[11px] text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="postback">Postback</option>
                  <option value="url">URL</option>
                </select>
                {btn.type === "postback" ? (
                  <input
                    type="text"
                    value={btn.payload || ""}
                    onChange={(e) =>
                      updateButton(i, { ...btn, payload: e.target.value })
                    }
                    placeholder="Valor del payload"
                    className="flex-1 rounded border border-border bg-card px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="url"
                    value={btn.url || ""}
                    onChange={(e) =>
                      updateButton(i, { ...btn, url: e.target.value })
                    }
                    placeholder="https://..."
                    className="flex-1 rounded border border-border bg-card px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
