(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ─── Animated cloud/smoke background ─── */
    (function () {
        var canvas = document.getElementById('clouds');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var w, h;
        var rafId = null;
        var resizeQueued = false;

        var colors = [
            [18, 16, 15],
            [22, 20, 18],
            [15, 14, 13],
            [25, 23, 21],
            [20, 18, 16],
            [12, 11, 10],
            [28, 26, 24],
            [22, 20, 19],
            [16, 15, 14],
            [30, 28, 26],
        ];

        function setSize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
        setSize();

        // Pre-render each blob's radial gradient once; per-frame work is then
        // just drawImage, which avoids 28 gradient allocations every frame.
        function makeSprite(color, alpha, r) {
            var size = Math.ceil(r * 2);
            var c = document.createElement('canvas');
            c.width = size;
            c.height = size;
            var g = c.getContext('2d');
            var grad = g.createRadialGradient(r, r, 0, r, r, r);
            grad.addColorStop(0, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + alpha + ')');
            grad.addColorStop(0.5, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (alpha * 0.4) + ')');
            grad.addColorStop(1, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0)');
            g.fillStyle = grad;
            g.fillRect(0, 0, size, size);
            return c;
        }

        var blobs = [];

        for (var i = 0; i < 24; i++) {
            var c = colors[i % colors.length];
            var r = 180 + Math.random() * 350;
            var alpha = 0.09 + Math.random() * 0.13;
            blobs.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: r,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.3,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.002 + Math.random() * 0.006,
                sprite: makeSprite(c, alpha, r),
            });
        }

        // Red glow blobs behind the logo area
        for (var j = 0; j < 4; j++) {
            var gr = 250 + Math.random() * 200;
            var galpha = 0.12 + Math.random() * 0.07;
            blobs.push({
                x: w * 0.4 + Math.random() * w * 0.2,
                y: h * 0.3 + Math.random() * h * 0.2,
                r: gr,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.1,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.002 + Math.random() * 0.003,
                sprite: makeSprite([210, 45, 55], galpha, gr),
            });
        }

        function drawFrame(t) {
            ctx.fillStyle = '#050508';
            ctx.fillRect(0, 0, w, h);
            for (var k = 0; k < blobs.length; k++) {
                var b = blobs[k];
                b.x += b.vx;
                b.y += b.vy;
                // Wrap using the maximum pulsed radius so edges never pop
                var m = b.r * 1.15;
                if (b.x < -m) b.x = w + m;
                if (b.x > w + m) b.x = -m;
                if (b.y < -m) b.y = h + m;
                if (b.y > h + m) b.y = -m;
                var pulse = Math.sin(t * b.pulseSpeed + b.phase) * 0.15 + 1;
                var pr = b.r * pulse;
                ctx.drawImage(b.sprite, b.x - pr, b.y - pr, pr * 2, pr * 2);
            }
        }

        function loop(t) {
            drawFrame(t);
            rafId = requestAnimationFrame(loop);
        }

        function start() {
            if (rafId === null) rafId = requestAnimationFrame(loop);
        }

        function stop() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        window.addEventListener('resize', function () {
            if (resizeQueued) return;
            resizeQueued = true;
            requestAnimationFrame(function () {
                resizeQueued = false;
                if (window.innerWidth === w && window.innerHeight === h) return;
                var oldW = w;
                var oldH = h;
                setSize();
                for (var k = 0; k < blobs.length; k++) {
                    blobs[k].x *= w / oldW;
                    blobs[k].y *= h / oldH;
                }
                if (reducedMotion) drawFrame(0);
            });
        });

        if (reducedMotion) {
            drawFrame(0);
        } else {
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) stop();
                else start();
            });
            start();
        }
    })();

    /* ─── Nav disclosure menu ─── */
    var menuBtn = document.getElementById('menuBtn');
    var dropdown = menuBtn ? menuBtn.parentElement : null;
    if (menuBtn && dropdown) {
        var setOpen = function (open) {
            dropdown.classList.toggle('open', open);
            menuBtn.setAttribute('aria-expanded', String(open));
        };
        menuBtn.addEventListener('click', function () {
            setOpen(!dropdown.classList.contains('open'));
        });
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target)) setOpen(false);
        });
        dropdown.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && dropdown.classList.contains('open')) {
                setOpen(false);
                menuBtn.focus();
            }
        });
        dropdown.addEventListener('focusout', function (e) {
            if (!dropdown.contains(e.relatedTarget)) setOpen(false);
        });
        dropdown.querySelector('.nav-dropdown-menu').addEventListener('click', function () {
            setOpen(false);
        });
    }

    /* ─── Nav shrink on scroll ─── */
    var nav = document.getElementById('nav');
    if (nav) {
        window.addEventListener('scroll', function () {
            nav.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
    }

    /* ─── Scroll reveal ─── */
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        reveals.forEach(function (el) { observer.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ─── Footer year ─── */
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

    /* ─── Contact form ─── */
    var form = document.getElementById('contactForm');
    var status = document.getElementById('formStatus');
    if (form && status) {
        var btn = form.querySelector('.submit-btn');
        var btnLabel = btn.querySelector('.btn-label');
        var isSubmitting = false;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (isSubmitting) return;
            isSubmitting = true;
            btn.setAttribute('aria-disabled', 'true');
            btnLabel.textContent = 'Sending...';
            status.className = 'form-status';
            status.textContent = 'Sending your message...';

            var signal;
            if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
                signal = AbortSignal.timeout(10000);
            }

            fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' },
                signal: signal,
            }).then(function (response) {
                if (response.ok) {
                    status.className = 'form-status success';
                    status.textContent = "Message sent successfully! We'll be in touch soon.";
                    form.reset();
                    return null;
                }
                return response.json().then(function (data) {
                    var detail = (data && data.errors && data.errors.length)
                        ? data.errors.map(function (err) { return err.message; }).join(', ')
                        : 'Please try again later.';
                    status.className = 'form-status error';
                    status.textContent = 'Something went wrong. ' + detail;
                }, function () {
                    status.className = 'form-status error';
                    status.textContent = 'Something went wrong. Please try again later.';
                });
            }).catch(function (err) {
                console.error('Contact form submission failed:', err);
                status.className = 'form-status error';
                status.textContent = (err && err.name === 'TimeoutError')
                    ? 'The request timed out. Please check your connection and try again.'
                    : 'Something went wrong. Please try again later.';
            }).finally(function () {
                isSubmitting = false;
                btn.removeAttribute('aria-disabled');
                btnLabel.textContent = 'Send Message';
            });
        });
    }
})();
