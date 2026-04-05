function abrirRangos() {
    const el = document.getElementById('rangosOffcanvas');
    if (!el || !window.bootstrap) return;
    const oc = bootstrap.Offcanvas.getOrCreateInstance(el);
    oc.show();
}

function cerrarRangos() {
    const el = document.getElementById('rangosOffcanvas');
    if (!el || !window.bootstrap) return;
    const oc = bootstrap.Offcanvas.getInstance(el);
    if (oc) oc.hide();
}
