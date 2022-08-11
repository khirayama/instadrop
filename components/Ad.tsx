export function Ad() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <ins
        class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-1858903845445485"
        data-ad-slot="8775190327"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    ` }}
    />
  );
}
