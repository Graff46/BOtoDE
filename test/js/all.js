
$('#logo').click(e => e.target.style.borderRadius = e.target.style.borderRadius === '10vmin' ? '2px' : '10vmin');

$('*[xtitle]').hover(e => e.type === 'mouseenter' ? $(e.target.nextElementSibling).delay(2000).fadeIn({duration: 1000, easing: 'linear'}) : $(e.target.nextElementSibling).fadeOut(100));

{
    // change lib name in header
    const caption = ['BOtoDE', '{BOtoDE/>', 'BO2DE', '{BO2DE/>'];
    const changeHeadCaption = () => caption[Math.floor(Math.random() * 4)];
    $('header>h1').on('wheel', e => e.target.textContent = changeHeadCaption()).text(changeHeadCaption());

    const sloganTxt = "JavaScript library isn't for you";
    const noter = document.querySelector('#noter');
    const slogan = document.querySelectorAll('#slogan > h1 > span').item(1);
    const h1 = $('#slogan > h1');

    const changeSlogan = cond => {
        noter.textContent = cond ? '' : '!';
        slogan.textContent = cond ? sloganTxt.replace("isn't ", '') : sloganTxt;
        cond ? h1.addClass('slogan-shot') : h1.removeClass('slogan-shot');
    };

    $('#slogan').click(e => changeSlogan(e.target.id === 'noter'));
}

Local.set({
    mark1: {
        ru: 'Библиотека BOToDE позвооляет осуществлять односторонюю и двустороннюю привязку JavaScript данных к параметрам и свойствам элементов DOM без написания кода в верстке, что было определяющим фактором при создании данной библиотеки.',
        en: 'English text',
    },

    mark2p1: {
        ru: "Текст1",
    },

    mark2p2: {
        ru: "Текст2",
    },
});

function loadScript(src, defer) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = Boolean(defer);
    document.head.append(script);
}

function test() {
    $.get('./test/sandbox.html', txt => document.querySelector('main').innerHTML = txt);
    loadScript("test/js/main.js", true);
}