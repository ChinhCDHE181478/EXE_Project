"use client";

export default function MapPane() {
  return (
    <aside className="bg-white shadow-xl ring-1 ring-black/5 sticky top-20 h-[calc(100vh-6rem)]">
      <iframe
        title="map"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d948560.4370283389!2d106.707!3d20.983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a58a7cf6d2c89%3A0x9a2b7a2c2fd0f1ad!2zSOG6oSBMw6FuZw!5e0!3m2!1svi!2s!4v1700000000000"
      />
    </aside>
  );
}
