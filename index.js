
//var madohomu_root = ''
//madohomu_root = 'https://ipv6.haojiezhe12345.top:82/madohomu/'

function loadComments(queryObj = {}, keepPosEl = undefined, noKami = false) {
    //if (from == null && time == null) setTodayCommentCount()

    var isCommentsNewer = queryObj.db == 'kami'
        ? (queryObj.from > getMaxKamiID())
        : (queryObj.from > getMaxCommentID())
    var isCommentsOlder = queryObj.db == 'kami'
        ? (queryObj.from < getMinKamiID())
        : (queryObj.from < getMinCommentID())

    const xhr = new XMLHttpRequest();

    xhr.open("GET", "https://haojiezhe12345.top:82/madohomu/api/comments" + obj2queryString(queryObj));

    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.status == 200) {
            //console.log(xhr.response);
            isLoadCommentErrorShowed = false

            if (debug) console.log(queryObj)
            if (debug) console.log('isNewer:', isCommentsNewer, ' isOlder:', isCommentsOlder, ' length:', xhr.response.length)

            // handle empty response
            if (xhr.response.length == 0) {
                if (isCommentsNewer) {
                    console.log('comments are up to date')
                    document.getElementById('loadingIndicatorBefore').style.display = 'none'
                    commentsUpToDate = true
                    window.clearCommentsUpToDateTimeout = setTimeout(() => {
                        commentsUpToDate = false
                    }, 10000);
                    return
                }
                if (isCommentsOlder && queryObj.db == 'kami') {
                    console.log('reached the oldest comment')
                    document.getElementById('loadingIndicator').style.display = 'none'
                    return
                }

                if (queryObj.from && document.getElementsByClassName('commentItem').length == 0) {
                    document.getElementById('loadingIndicatorBefore').style.display = 'none'
                    //document.getElementById('loadingIndicator').style.display = 'none'
                    //pauseCommentScroll = true

                    // NEED MORE ...
                    //
                }
                return
            }

            // update timeline & today comment count
            if (xhr.response[0].time > maxTimelineTime) {
                maxTimelineTime = xhr.response[0].time
                loadTimeline(maxTimelineTime)
                setTodayCommentCount()
            }

            // save old comment position before inserting new comments
            var keepPos = (xhr.response[0].time > getMaxCommentTime() || keepPosEl != undefined)
            if (debug) console.log('KeepPos:', keepPos)
            if (keepPosEl == undefined) {
                keepPosEl = document.getElementById('loadingIndicatorBefore').nextElementSibling
            }
            var prevCommentTop = keepPosEl.getBoundingClientRect().top
            var prevCommentLeft = keepPosEl.getBoundingClientRect().left

            // save prev Max/MinCommentTime for loading kami SxS
            var prevMaxCommentTime = getMaxCommentTime()
            var prevMinCommentTime = getMinCommentTime()

            // insert comments
            for (let comment of xhr.response) {

                // skip hidden
                if (comment.hidden == 1 && !document.getElementById('showHidden').checked) {
                    console.log('skipping hidden comment #' + comment.id + ' ' + comment.comment)
                    continue
                }
                // skip 2024 kami msgs when loading 2023.05
                if (queryObj.db == 'kami' && comment.id >= 35668 && getMaxCommentTime() <= 1684651800) {
                    continue
                }

                insertComment(comment, queryObj.db == 'kami' ? true : false)

            }

            // restore the postition after inserting comments
            if (keepPos && document.getElementById('topComment') == null) {
                if (debug) console.log(keepPosEl)
                if (isFullscreen) {
                    var newCommentTop = keepPosEl.getBoundingClientRect().top
                    commentDiv.scrollTop += newCommentTop - prevCommentTop
                } else {
                    var newCommentLeft = keepPosEl.getBoundingClientRect().left
                    commentDiv.scrollLeft += newCommentLeft - prevCommentLeft
                }
            }

            // load kami SxS
            if (showKamiElmnt.checked == true && queryObj.db == null && noKami == false) {
                if (isCommentsOlder) {
                    loadComments({
                        'timeMin': xhr.response[xhr.response.length - 1].time,
                        'timeMax': prevMinCommentTime,
                        'db': 'kami'
                    })
                } else if (isCommentsNewer) {
                    loadComments({
                        'timeMin': prevMaxCommentTime,
                        'timeMax': xhr.response[0].time,
                        'db': 'kami'
                    }, keepPosEl)
                } else if (queryObj.time != null || queryObj.from != null) {
                    loadComments({
                        'timeMin': xhr.response[xhr.response.length - 1].time,
                        'timeMax': xhr.response[0].time,
                        'db': 'kami'
                    })
                } else if (queryObj.timeMin == null && queryObj.timeMax == null) {
                    loadComments({
                        'timeMin': xhr.response[xhr.response.length - 1].time,
                        'timeMax': parseInt(Date.now() / 1000),
                        'db': 'kami'
                    })
                }
            }

            setTimelineActiveMonth(true)

            if (debug) console.log('maxID:', getMaxCommentID(), ' minID:', getMinCommentID())

        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.onerror = () => {
        if (isLoadCommentErrorShowed == false && kami == false) {
            window.alert([
                '加载留言失败',
                '请尝试刷新页面, 清除DNS缓存, 切换网络, 或者10分钟后重试',
                '如数小时内仍未解决, 请发邮件到 3112611479@qq.com (或加此QQ)',
                '',
                'Failed to load messages',
                'Try refreshing this page, flush DNS cache, switch to mobile data, or try again in 10 minutes',
                'Please contact 3112611479@qq.com if it\'s not fixed for hours',
            ].join('\n'))
            isLoadCommentErrorShowed = true
        }
    }
    xhr.send();
}

function insertComment(comment, isKami = false) {
    //if (debug) console.log('Inserting comment', comment.id)
    var insertBeforeEl = null

    // compare comments by time, then ID
    function compareCommentAt(i) {
        return compareArr(
            [comment.time, comment.id],
            [parseInt(commentList[i].dataset.timestamp),
            commentList[i].id == ''
                ? parseInt(commentList[i].dataset.kamiid.replace('#', ''))
                : parseInt(commentList[i].id.replace('#', ''))
            ])
    }
    var commentList = document.getElementsByClassName('commentItem')
    // insert into []
    // this matches all lists of length 0
    if (commentList.length == 0) {
        insertBeforeEl = document.getElementById('loadingIndicator')
    } else {
        // insert into the leftmost or rightmost of [0], [0, 1, 2 ...]
        // this matches all lists of length 1, and some of those >= 2
        if (compareCommentAt(0) > 0) {
            insertBeforeEl = commentList[0]
        } else if (compareCommentAt(commentList.length - 1) < 0) {
            insertBeforeEl = document.getElementById('loadingIndicator')
        } else {
            // insert into the middle of [0, 1, ...]
            // this matches all lists with length >= 2
            for (let i = 0; i < commentList.length - 1; i++) {
                if (compareCommentAt(i) < 0 && compareCommentAt(i + 1) > 0) {
                    insertBeforeEl = commentList[i + 1]
                    break
                }
            }
        }
    }
    // if insert fails, there must be two same comments
    if (insertBeforeEl == null) {
        console.log('Duplicate comment detected:', comment.id)
        return
    }
    //if (debug) console.log('Insert before:', insertBeforeEl)

    var time = new Date(comment.time * 1000)
    date = time.toLocaleDateString()
    hour = time.toLocaleTimeString()

    var randBG
    while (true) {
        randBG = getRandomIntInclusive(1, msgBgCount)
        if (!lastBgImgs.includes(randBG)) {
            break
        }
    }
    lastBgImgs.push(randBG)
    if (lastBgImgs.length > 5) {
        lastBgImgs.splice(0, 1)
    }

    if (isKami == true) {
        comment.comment = comment.comment.replace('This message is sent using a proxy. If it is dirty, please click here to delete it.', '')
    }

    var imgsDOM = '<br><br>'
    try {
        if (comment.image != '') {
            for (var i of comment.image.split(',')) {
                imgsDOM += `<img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this.src); document.getElementById('lowerPanel').classList.add('lowerPanelUp')">`
            }
        }
    } catch (error) { }

    commentDiv.insertBefore(html2elmnt(`
        <div class="commentBox commentItem" ${isKami == true ? `data-kamiid="#${comment.id}` : `id="#${comment.id}`}" data-timestamp="${comment.time}">
            <img class="bg" loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${randBG}.jpg" ${(comment.hidden == 1) ? 'style="display: none;"' : ''}>
            <div class="bgcover"></div>
            <img class="avatar" loading="lazy" src="${isKami == true ? `https://kami.im/getavatar.php?uid=${comment.uid}` : `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${comment.sender}.jpg`}"
                onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'"
                onclick="
                    showUserComment('${comment.sender.replace(/\'/g, "\\'")}'${isKami == true ? `, ${comment.uid}` : ''});
                    document.getElementById('lowerPanel').classList.add('lowerPanelUp')
                ">
            <div class="sender" onclick="
                showUserComment('${comment.sender.replace(/\'/g, "\\'")}'${isKami == true ? `, ${comment.uid}` : ''});
                document.getElementById('lowerPanel').classList.add('lowerPanelUp')
                ">
                ${comment.sender == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : comment.sender}
            </div>
            <div class="id">#${comment.id}${isKami == true ? ' (kami.im)' : ''}</div>
            <div class="comment" onwheel="if (!isFullscreen) event.preventDefault()">
                ${htmlEscape(comment.comment)}
                ${imgsDOM}
            </div>
            <div class="time">${date + ' ' + hour}${(comment.hidden == 1) ? ' (hidden)' : ''}</div>
        </div>
    `), insertBeforeEl)
}

function clearComments(clearTop) {
    //commentDiv.removeEventListener("scroll", commentScroll)
    if (clearTop == 1) {
        commentDiv.innerHTML = loadingIndicatorBefore + loadingIndicator
    } else {
        commentDiv.innerHTML = topComment + loadingIndicatorBefore + loadingIndicator
        document.getElementById('loadingIndicatorBefore').style.display = 'none'
    }

    pauseCommentScroll = false
    commentsUpToDate = false
    clearTimeout(window.clearCommentsUpToDateTimeout)

    newCommentDisabled = false
    commentHorizontalScrolled = 0
    document.body.classList.remove('touchKeyboardShowing')
}

function commentScroll() {
    if (pauseCommentScroll || document.getElementsByClassName('commentItem').length == 0) return

    setTimelineActiveMonth()

    if (!isFullscreen) {
        var toRight = commentDiv.scrollWidth - commentDiv.clientWidth - commentDiv.scrollLeft
        var toLeft = commentDiv.scrollLeft
        //console.log(toLeft, toRight)
        if (toLeft < 40) { document.getElementsByClassName('commentSeekArrow')[0].style.display = 'none' }
        else { document.getElementsByClassName('commentSeekArrow')[0].style.removeProperty('display') }

        if (toRight <= 40) { loadOlderComments() }
        else if (toLeft <= 40 && commentsUpToDate == false) { loadNewerComments() }
        else return

    } else {
        var toBottom = commentDiv.scrollHeight - commentDiv.clientHeight - commentDiv.scrollTop
        var toTop = commentDiv.scrollTop
        //console.log(toTop, toBottom)
        if (toBottom <= 40) { loadOlderComments() }
        else if (toTop <= 40 && commentsUpToDate == false) { loadNewerComments() }
        else return
    }
    //commentDiv.removeEventListener("scroll", commentScroll)
    pauseCommentScroll = true
    setTimeout(() => {
        //commentDiv.addEventListener("scroll", commentScroll)
        pauseCommentScroll = false
    }, 500);
}

function loadOlderComments() {
    if (getMinCommentID() == null || getMinCommentID() <= 1) {
        // no madohomu, or reached end
        if (getMinKamiID() == null) {
            // madohomu reached end, need to load kami
            loadComments({ 'from': 35662, 'db': 'kami' })
        } else {
            // load older kami
            loadComments({ 'from': getMinKamiID() - 1, 'db': 'kami' })
        }
    } else {
        // load older madohomu
        loadComments({ 'from': getMinCommentID() - 1 })
    }
}

function loadNewerComments() {
    if (document.getElementById('newCommentBox') != null && document.getElementById('topComment') == null) {
        console.log('newCommentBox is active, and you are viewing older comments\nskipping upper comments')
        document.getElementById('loadingIndicatorBefore').style.display = 'none'
        return
    }

    var count = 10
    if (isFullscreen) {
        count = getFullscreenHorizonalCommentCount() * 2
        while (count < 9) {
            count += getFullscreenHorizonalCommentCount()
        }
        commentDiv.scrollTop = 0
    }

    if (getMaxKamiID() == null || getMaxKamiID() >= 35662) {
        // no kami, or >2023.05
        if (getMaxCommentID() == null) {
            // jumped to a kami msg >2023.05 and need to load madohomu
            // load newer madohomu by maxKamiTime (can be omitted, it will load on next commentScroll)
            if (getMaxKamiID() == 35662) loadComments({ 'time': getMaxCommentTime() }, document.getElementById('loadingIndicatorBefore').nextElementSibling)
            // load madohomu between minKamiTime and maxKamiTime, no need if kami <2023.05
            if (getMaxKamiID() != 35662) loadComments({ 'timeMin': getMinCommentTime(), 'timeMax': getMaxCommentTime() }, document.getElementById('loadingIndicatorBefore').nextElementSibling, true)
        } else {
            // load newer madohomu
            loadComments({ 'from': getMaxCommentID() + count, 'count': count })
        }
    } else {
        // load kami <2023.05
        loadComments({ 'from': getMaxKamiID() + count, 'count': count, 'db': 'kami' })
    }
}

function getMaxCommentID() {
    var commentList = document.querySelectorAll('.commentItem[id^="#"]')
    if (commentList.length > 0) return parseInt(commentList[0].id.replace('#', ''))
}

function getMinCommentID() {
    var commentList = document.querySelectorAll('.commentItem[id^="#"]')
    if (commentList.length > 0) return parseInt(commentList[commentList.length - 1].id.replace('#', ''))
}

function getMaxKamiID() {
    var commentList = document.querySelectorAll('.commentItem[data-kamiid^="#"]')
    if (commentList.length > 0) return parseInt(commentList[0].dataset.kamiid.replace('#', ''))
}

function getMinKamiID() {
    var commentList = document.querySelectorAll('.commentItem[data-kamiid^="#"]')
    if (commentList.length > 0) return parseInt(commentList[commentList.length - 1].dataset.kamiid.replace('#', ''))
}

function getMaxCommentTime() {
    var commentList = document.querySelectorAll('.commentItem')
    if (commentList.length > 0) return parseInt(commentList[0].dataset.timestamp)
}

function getMinCommentTime() {
    var commentList = document.querySelectorAll('.commentItem')
    if (commentList.length > 0) return parseInt(commentList[commentList.length - 1].dataset.timestamp)
}

// new message box
//
function newComment() {
    commentDiv.scrollLeft = 0
    commentDiv.scrollTop = 0

    prevWindowWidth = window.innerWidth
    prevWindowHeight = window.innerHeight
    if (debug) console.log(`${prevWindowWidth}x${prevWindowHeight}`)

    if (newCommentDisabled) {
        document.getElementById('msgText').focus({ preventScroll: true })
        return
    }

    commentDiv.insertBefore(html2elmnt(`
        <div class="commentBox" id="newCommentBox">
            <div class="bgcover"></div>
            <img class="avatar" id="msgPopupAvatar" src="https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'" onclick="showPopup('setNamePopup')">
            <div class="sender" id="senderText" onclick="showPopup('setNamePopup')">${getConfig('username')}</div>
            <div class="id" onclick="showPopup('setNamePopup')"><span class="ui zh">设置昵称/头像</span><span class="ui en">Change profile</span></div>
            <div class="comment">
                <textarea id="msgText" placeholder="圆神保佑~" style="height: 100%"></textarea>
                <div id="uploadImgList" style="display: none"></div>
            </div>
            <label>
                <input id="uploadImgPicker" type="file" accept="image/*" onchange="previewLocalImgs()" multiple style="display: none;" />
                <span><span class="ui zh">+ 添加图片</span><span class="ui en">+ Add images</span></span>
            </label>
            <button id="sendBtn" onclick="sendMessage()"><span class="ui zh">发送 ✔</span><span class="ui en">Send ✔</span></button>
        </div>
    `), commentDiv.firstElementChild)

    document.getElementById('msgText').addEventListener('focusin', () => {
        //console.log('msgText focused')
        document.getElementById('lowerPanel').classList.add('lowerPanelUp')
    })
    document.getElementById('msgText').addEventListener('focusout', () => {
        //console.log('msgText lost focus')
        //document.getElementById('lowerPanel').classList.remove('lowerPanelUp')
    })

    document.getElementById('msgText').focus({ preventScroll: true })

    newCommentDisabled = true

    /*
    if (location.hostname != 'haojiezhe12345.top') {
        document.getElementById('banner').style.display = 'block'
    }
    */
}

function previewLocalImgs() {
    var imgUploadInput = document.getElementById('uploadImgPicker')

    if (imgUploadInput.files.length === 0) {
        console.log('No file chosen')
        return;
    }

    for (let i = 0; i < imgUploadInput.files.length; i++) {
        const imgfile = imgUploadInput.files[i]

        //console.log(imgfile)
        if (!imgfile.type.match(/image.*/)) {
            console.log(`Invalid image file ${imgfile.name}`)
            continue;
        }

        let fileReader = new FileReader();
        fileReader.readAsDataURL(imgfile);
        fileReader.onload = () => {

            //console.log(fileReader.result)
            let image = new Image();
            image.src = fileReader.result;
            image.onload = () => {

                //console.log(image)
                var width = image.width;
                var height = image.height;

                const max_pixels = 2.1 * 1000 * 1000;
                if (width * height > max_pixels) {
                    let zoom = Math.sqrt(max_pixels / (width * height))
                    width = Math.round(width * zoom)
                    height = Math.round(height * zoom)
                }

                var canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0, width, height);

                var imgDataURL = canvas.toDataURL("image/jpeg")

                document.getElementById('uploadImgList').appendChild(html2elmnt(`
                    <div>
                        <img src="${imgDataURL}" class="uploadImg" onclick="viewImg(this.src)">
                        <button onclick="this.parentNode.remove()">❌</button>
                    </div>
                `))
                document.getElementById('msgText').style = ''
                document.getElementById('uploadImgList').style = ''
            }
        };
    }

    imgUploadInput.value = ''
}

function sendMessage() {
    var sender = getConfig('username')
    var msg = document.getElementById('msgText').value

    var imgList = []
    var uploadImgClass = document.getElementsByClassName('uploadImg')
    if (uploadImgClass.length > 0) {
        for (let i = 0; i < uploadImgClass.length; i++) {
            const imgElmnt = uploadImgClass[i]
            imgList.push(imgElmnt.src.split(';base64,')[1])
        }
    }

    if (msg.replace(/\s/g, '') == '') {
        window.alert('请输入留言内容!\nDo not leave the message empty!')
        return
    }
    if (sender.replace(/\s/g, '') == '') {
        sender = '匿名用户'
    }

    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').innerHTML = '<span class="ui zh">正在发送…</span><span class="ui en">Sending…</span>'

    var xhr = new XMLHttpRequest();
    var url = "https://haojiezhe12345.top:82/madohomu/api/post";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            document.getElementById('sendBtn').innerHTML = '<span class="ui zh">发送成功!</span><span class="ui en">Sent!</span>'
            setTimeout(() => {
                clearComments()
                loadComments()
            }, 1000);
        }
    };
    xhr.onerror = () => {
        window.alert('发送留言失败\n如果问题持续, 请发邮件到 3112611479@qq.com (或加此QQ)\n\nFailed to send message, if problem persists, please contact 3112611479@qq.com')
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('sendBtn').innerHTML = '<span class="ui zh">发送 ✔</span><span class="ui en">Send ✔</span>'
    }
    var data = JSON.stringify({
        "sender": sender,
        "comment": msg,
        'images': imgList
    });
    xhr.send(data);
}

// popup
//
const popup = {
    elements: {
        popupContainer: document.getElementById('popupContainer'),
        popupItems: document.getElementsByClassName('popupItem'),
    },

    hideAllPopupItems() {
        for (let i = 0; i < this.elements.popupItems.length; i++) {
            this.elements.popupItems[i].style.display = 'none';
        }
    },

    show(popupID) {
        if (location.hash.slice(0, 7) != '#popup-') {
            location.hash = 'popup'
        }

        this.hideAllPopupItems()
        this.elements.popupContainer.style.removeProperty('display');
        document.getElementById(popupID).style.removeProperty('display');

        switch (popupID) {
            case 'setNamePopup':
                document.getElementById('setNameInput').value = getConfig('username')
                break;

            case 'setAvatarPopup':
                avatarInput.value = ''
                setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg?${new Date().getTime()}`
                setAvatarImg.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
                break

            case 'getImgPopup':
                document.getElementById('getImgPopup').firstElementChild.lastElementChild.innerHTML = ''
                for (var key in themes) {
                    var themeName = themes[key]
                    try {
                        for (let j = 0; j < document.getElementsByClassName(`${themeName}bg`).length; j++) {
                            document.getElementById('getImgPopup').firstElementChild.lastElementChild.appendChild(html2elmnt(`
                                    <img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/${themeName != 'default' ? themeName : ''}/mainbg${j + 1}.jpg" style="min-height: 40vh;" onload="this.style.removeProperty('min-height')">
                                    <p>
                                        ${document.getElementsByClassName(`${themeName}bg`)[j].children[1].innerHTML}
                                        ${document.getElementsByClassName(`${themeName}bg`)[j].dataset.pixivid != null ? `
                                            <a href="https://www.pixiv.net/artworks/${document.getElementsByClassName(`${themeName}bg`)[j].dataset.pixivid}" target="_blank">Pixiv↗</a>
                                        ` : ''}
                                    </p>
                                    <br>
                                `))
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
                for (let i = 0; i < msgBgCount; i++) {
                    document.getElementById('getImgPopup').firstElementChild.lastElementChild.appendChild(html2elmnt(`
                        <img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/bg/msgbg${i + 1}.jpg" style="min-height: 40vh;" onload="this.style.removeProperty('min-height')">
                        <p>
                            ${msgBgInfo[i].description != null
                            ? msgBgInfo[i].description
                            : `Artwork by ${msgBgInfo[i].illustrator} <a href="https://www.pixiv.net/artworks/${msgBgInfo[i].pixivid}" target="_blank">Pixiv↗</a>`}
                        </p>
                        <br>
                    `))
                }
                break

            case 'displaySettings':
                let mode = getConfig('graphicsMode')
                document.getElementById('graphicsMode').value = mode ? mode : 'high'
                iframeCom.send('getPageZoom')
                break

            default:
                break;
        }
    },

    close() {
        if (location.hash == '#popup') {
            history.back()
            return
        }

        this.elements.popupContainer.style.display = 'none';
        this.hideAllPopupItems()
    },

    isOpen() {
        return this.elements.popupContainer.style.display != 'none' ? true : false
    },

    init() {
        this.elements.popupContainer.onclick = e => {
            if (e.target.classList.contains('closeBtn') || e.target.id == 'popupBG') {
                this.close()
            }
        }
    },
}

const showPopup = id => popup.show(id)
const closePopup = () => popup.close()
try {
    popup.init()
} catch (error) {
    logErr(error, 'failed to init popup')
}

// user related
//
function setUserName() {
    var inputName = document.getElementById('setNameInput').value;

    try {
        var invalidFileChars = "\\/:*?\"<>|;";
        var validFileChars = "＼／：＊？＂＜＞｜；";
        for (i = 0; i < invalidFileChars.length; i++) {
            //var re = new RegExp(invalidFileChars[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            //inputName = inputName.replace(re, validFileChars[i]);
            inputName = inputName.split(invalidFileChars[i]).join(validFileChars[i])
        }
    } catch (error) {
        console.log(error)
    }

    if (['', '匿名用户'].includes(inputName)) {
        closePopup()
        return
    }

    setConfig('username', inputName)

    if (getConfig('username') == '10.3') {
        //location.reload()
        closePopup()
    } else {
        showPopup('setAvatarPopup')
    }

    loadUserInfo()
}

function uploadAvatar() {

    if (avatarInput.files.length === 0) {
        console.log('No file chosen')
        return;
    }
    if (!avatarInput.files[0].type.match(/image.*/)) {
        window.alert("图片无效\nInvalid image");
        return;
    }

    var fileReader = new FileReader();
    fileReader.onload = () => {
        var image = new Image();
        image.onload = () => {

            var MIN_WIDTH = 200;
            var MIN_HEIGHT = 200;
            var width = image.width;
            var height = image.height;
            if (width > height) {
                if (height > MIN_HEIGHT) {
                    width *= MIN_HEIGHT / height;
                    height = MIN_HEIGHT;
                }
            } else {
                if (width > MIN_WIDTH) {
                    height *= MIN_WIDTH / width;
                    width = MIN_WIDTH;
                }
            }

            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, width, height);

            fetch(canvas.toDataURL("image/jpeg")).then(res => res.blob()).then((blob) => {

                var xhr = new XMLHttpRequest();
                xhr.open("POST", "https://haojiezhe12345.top:82/madohomu/api/upload");
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        console.log(xhr.responseText);
                        setAvatarImg.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg?${new Date().getTime()}`
                        loadUserInfo()
                    }
                };
                var formData = new FormData();
                formData.append(`${getConfig('username')}.jpg`, blob)
                xhr.send(formData);

            })
        }
        image.src = fileReader.result;
    };
    fileReader.readAsDataURL(avatarInput.files[0]);
}

function loadUserInfo() {
    var userInfo = document.getElementById('userInfo')
    var avatar = document.getElementById('userInfoAvatar')
    var name = document.getElementById('userInfoName')

    avatar.onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    avatar.src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg?${new Date().getTime()}`

    if (getConfig('username') == '') {
        name.innerHTML = '<span class="ui zh">访客</span><span class="ui en">Anonymous</span>'
        userInfo.onclick = () => { showPopup('setNamePopup') }
        userInfo.classList.add('nologin')
    } else {
        name.innerText = getConfig('username')
        userInfo.onclick = undefined
        userInfo.classList.remove('nologin')
    }

    try {
        document.getElementById('senderText').innerHTML = getConfig('username')
        document.getElementById('msgPopupAvatar').src = `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${getConfig('username')}.jpg?${new Date().getTime()}`
        document.getElementById('msgPopupAvatar').onerror = function () { this.onerror = null; this.src = 'https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png' }
    } catch (error) { }
}

function showUserComment(user, useKamiAvatar = false) {
    if (debug) console.log(user)
    if ((user == null && userCommentUser == '') || user == '') {
        if (debug) console.log('empty user!')
        return
    };

    userCommentEl.removeEventListener('scroll', userCommentScroll)

    if (user != null) {
        userCommentEl.innerHTML = `
        <h2>
            <img src="${useKamiAvatar != false ? `https://kami.im/getavatar.php?uid=${useKamiAvatar}` : `https://haojiezhe12345.top:82/madohomu/api/data/images/avatars/${user}.jpg`}" onerror="this.onerror=null;this.src='https://haojiezhe12345.top:82/madohomu/api/data/images/defaultAvatar.png'">
            <span>${user == '匿名用户' ? '<span class="ui zh">匿名用户</span><span class="ui en">Anonymous</span>' : user}${useKamiAvatar != false ? `<span class='kamiuid'>${useKamiAvatar}</span>` : ''}</span>
        </h2>
        `
        showPopup('showUserCommentPopup')
        //userCommentEl.scrollTop = 0
        userCommentUser = user
        userCommentOffset = 0
        userCommentIsKami = false
    }

    const xhr = new XMLHttpRequest();

    if (user != null) {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?user=${user}&count=50`);
    } else {
        xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments?user=${userCommentUser}&from=${userCommentOffset}&count=50${userCommentIsKami == true ? '&db=kami' : ''}`);
        if (debug) console.log(userCommentUser, userCommentOffset)
    }

    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.status == 200) {

            for (var comment of xhr.response) {

                var time = new Date(comment.time * 1000)
                date = time.toLocaleDateString()
                hour = time.toLocaleTimeString()

                var imgsDOM = '<i></i>'
                try {
                    if (comment.image != '') {
                        for (var i of comment.image.split(',')) {
                            imgsDOM += `<img loading="lazy" src="https://haojiezhe12345.top:82/madohomu/api/data/images/posts/${i}.jpg" onclick="viewImg(this.src)">`
                        }
                    }
                } catch (error) { }

                userCommentEl.appendChild(html2elmnt(`
                    <div>
                        <p>${date + ' ' + hour}<span>#${comment.id}</span></p>
                        <p>
                            <span onclick="clearComments(1); loadComments({ 'from': ${comment.id}${userCommentIsKami == true ? ", 'db': 'kami'" : ""} }); closePopup()">
                                ${htmlEscape(comment.comment)}
                            </span>
                            ${imgsDOM}
                        </p>
                    </div>
                `))

                userCommentOffset++
            }

            if (userCommentIsKami == true && xhr.response.length < 10) {
                userCommentUser = ''
                userCommentEl.appendChild(html2elmnt(`
                    <h4>
                        <span class="ui zh">- 共 ${document.getElementById('userComment').getElementsByTagName("div").length} 条留言 -</span>
                        <span class="ui en">- Total ${document.getElementById('userComment').getElementsByTagName("div").length} messages -</span>
                    </h4>
                `))
            }
            if (userCommentIsKami == false && xhr.response.length < 10) {
                userCommentOffset = 0
                userCommentIsKami = true
                setTimeout(showUserComment)
            }

            userCommentEl.addEventListener('scroll', userCommentScroll)
        }
    }
    xhr.onerror = () => {
        setTimeout(() => {
            userCommentEl.addEventListener('scroll', userCommentScroll);
            userCommentScroll();
        }, 1000);
    }
    xhr.send();
}

function userCommentScroll() {
    var toBottom = userCommentEl.scrollHeight - userCommentEl.clientHeight - userCommentEl.scrollTop
    if (toBottom < 100 && popup.isOpen()) {
        showUserComment()
    }
}

// themes
//
function nextImg() {
    if (bgPaused) return

    var prevBG = currentBG
    if (currentBG + 1 < bgCount) {
        currentBG += 1
    } else {
        currentBG = 0
    }
    var nextBG
    if (currentBG + 1 < bgCount) {
        nextBG = currentBG + 1
    } else {
        nextBG = 0
    }

    //if (isBirthday) {
    if (theme != 'default') {
        var bgs = document.getElementsByClassName(`${theme}bg`)
        var bgurl = `https://haojiezhe12345.top:82/madohomu/bg/${theme}/`
    } else {
        var bgs = document.getElementsByClassName('defaultbg')
        var bgurl = 'https://haojiezhe12345.top:82/madohomu/bg/'
    }

    try {
        //bgs[prevBG].style.opacity = 0
        bgs[prevBG].style.removeProperty('opacity')
        bgs[currentBG].style.display = 'block'
        bgs[currentBG].style.opacity = 1
        bgs[currentBG].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${currentBG + 1}.jpg?2")`
        bgs[currentBG].firstElementChild.style.removeProperty('animation-name')
        setTimeout(() => {
            //bgs[prevBG].firstElementChild.style.animationName = 'none'
            bgs[prevBG].style.removeProperty('display')
            bgs[nextBG].style.display = 'block'
            bgs[nextBG].firstElementChild.style.backgroundImage = `url("${bgurl}mainbg${nextBG + 1}.jpg?2")`
            bgs[nextBG].firstElementChild.style.animationName = 'none'
        }, 2500);
    } catch (error) {
        console.log(error)
    }
}

function nextCaption() {
    if (bgPaused) return

    try {
        var themeCaptions = document.getElementsByClassName(`${theme}Caption`);
    } catch (error) {
        console.log(error)
        return
    }

    if (themeCaptions.length == 1) {
        themeCaptions[0].style.display = 'block';
        setTimeout(() => {
            captionDiv.style.opacity = 1
        }, 500);
        return
    }

    captionDiv.style.opacity = 0
    setTimeout(() => {
        for (var i = 0; i < themeCaptions.length; i++) {
            themeCaptions[i].style.display = 'none';
        }
        if (currentCaption < themeCaptions.length - 1) {
            currentCaption++
        } else {
            currentCaption = 0
        }
        themeCaptions[currentCaption].style.display = 'block';
        captionDiv.style.opacity = 1
    }, 1500);
}

function printParaCharOneByOne(divEl, delay = 0) {
    const paras = []
    for (let i = 0; i < divEl.children.length; i++) {
        const paraEl = divEl.children[i]
        paras.push(paraEl.innerHTML)
        paraEl.innerHTML = ''
    }
    let paraIndex = 0
    let charIndex = 0
    const pauseChars = [',', '.']
    const pauseMultiplier = 6
    let pauseCount = 0
    setTimeout(() => {
        let printInterval = setInterval(() => {
            if (paraIndex < paras.length) {
                if (charIndex < paras[paraIndex].length) {
                    const char = paras[paraIndex][charIndex]
                    if (pauseChars.includes(char)) {
                        if (pauseCount == 0) {
                            divEl.children[paraIndex].innerHTML += char
                        }
                        if (pauseCount < pauseMultiplier) {
                            pauseCount++
                            return
                        } else {
                            pauseCount = 0
                        }
                    } else {
                        divEl.children[paraIndex].innerHTML += char
                    }
                    charIndex++
                } else {
                    charIndex = 0
                    paraIndex++
                }
            } else {
                clearInterval(printInterval)
            }
        }, 50);
    }, delay);
}

function playWalpurgis(time_ms) {
    document.getElementById('videoBgBox').style.opacity = 1
    document.getElementById('videoBgBox').style.display = 'block'
    document.getElementById('mainVideo').src = 'https://haojiezhe12345.top:82/madohomu/media/walpurgis1.1.mp4'
    document.getElementById('mainVideo').play()
    //document.getElementById('mainVideoBg').src = 'https://haojiezhe12345.top:82/madohomu/media/walpurgis1.1.mp4'
    //document.getElementById('mainVideoBg').play()
    setTimeout(() => {
        document.getElementById('videoBgBox').style.opacity = 0
        setTimeout(() => {
            document.getElementById('videoBgBox').style.display = 'none'
        }, 1000);
    }, time_ms);
}

function changeLang(targetLang) {
    if (!targetLang) {
        if (navigator.language.slice(0, 2) == 'zh' || navigator.language.slice(0, 3) == 'yue') {
            targetLang = 'zh'
        } else {
            targetLang = 'en'
        }
    }
    if (!['zh', 'en'].includes(targetLang)) {
        console.log(`invalid lang "${targetLang}"`)
        return
    }
    document.getElementById('langCSS').innerHTML = `
    .ui {
        display: none !important;
    }
    .ui.${targetLang} {
        display: inline !important;
    }
    `
    console.log(`changed lang to ${targetLang}`)
}

function changeGraphicsMode(mode) {
    if (mode == 'high') {
        document.body.classList.remove('lowend')
        document.body.classList.remove('midend')
    } else if (mode == 'mid') {
        document.body.classList.remove('lowend')
        document.body.classList.add('midend')
    } else if (mode == 'low') {
        document.body.classList.add('lowend')
        document.body.classList.remove('midend')
    } else return
    setConfig('graphicsMode', mode)
}

function getFullscreenHorizonalCommentCount() {
    if (!isFullscreen) return null
    var latestCommentEl = document.getElementById('loadingIndicatorBefore').nextElementSibling
    var top = latestCommentEl.getBoundingClientRect().top
    latestCommentEl = latestCommentEl.nextElementSibling
    var count = 1
    while (top == latestCommentEl.getBoundingClientRect().top) {
        count++
        latestCommentEl = latestCommentEl.nextElementSibling
    }
    return count
}

function loadTimeline(timeStamp) {
    console.log('loading timeline from', timeStamp)

    var timelineEl = document.getElementById('timeline')
    timelineEl.innerHTML = ''
    var date = new Date(timeStamp * 1000)
    date.setDate(1)

    while (date.getFullYear() >= 2019) {

        var yearEl = document.createElement('p')
        yearEl.appendChild(html2elmnt(`<strong>${date.getFullYear()}</strong>`))

        while (true) {
            yearEl.appendChild(html2elmnt(`<span>${date.getMonth() + 1}</span>`))

            if (date.getFullYear() == 2019 && date.getMonth() + 1 == 2) {
                date.setFullYear(2011)
                break
            } else if (date.getMonth() == 0) {
                break
            } else {
                date.setMonth(date.getMonth() - 1)
            }
        }
        timelineEl.appendChild(yearEl)

        date.setMonth(date.getMonth() - 1)
    }
}

function getCurrentComment() {
    var scrolled = 0
    if (!isFullscreen) {
        scrolled = commentDiv.scrollLeft / (commentDiv.scrollWidth)// - commentDiv.clientWidth)
    } else {
        scrolled = commentDiv.scrollTop / (commentDiv.scrollHeight)// - commentDiv.clientHeight)
    }
    var commentList = document.getElementsByClassName('commentItem')
    return commentList[Math.round(commentList.length * scrolled)]
}

function setTimelineActiveMonth(scroll = false) {
    try {
        var timeStamp = parseInt(getCurrentComment().dataset.timestamp) * 1000
        var date = new Date(timeStamp)
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        //if (debug) console.log(id, timeStamp, year, month)
        const yearEls = document.getElementById('timeline').children
        for (let i = 0; i < yearEls.length; i++) {
            const yearEl = yearEls[i]
            if (yearEl.firstElementChild.innerHTML == year) {
                yearEl.firstElementChild.classList.add('month-active')
                if (scroll) yearEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
            } else {
                yearEl.firstElementChild.classList.remove('month-active')
            }
            for (let i = 0; i < yearEl.children.length; i++) {
                const monthEl = yearEl.children[i]
                if (monthEl.nodeName == 'SPAN') {
                    if (yearEl.firstElementChild.innerHTML == year && monthEl.innerHTML == month) {
                        monthEl.classList.add('month-active')
                        //if (scroll) monthEl.scrollIntoView(false)
                    } else {
                        monthEl.classList.remove('month-active')
                    }
                }
            }
        }
        setHoverCalendarActiveDay()
    } catch (error) {
        if (debug) console.log(error)
    }
}

function setHoverCalendarActiveDay() {
    try {
        var timeStamp = parseInt(getCurrentComment().dataset.timestamp) * 1000
        var date = new Date(timeStamp)
        const dayEls = hoverCalendarEl.querySelectorAll('div[data-time]')
        for (let i = 0; i < dayEls.length; i++) {
            const dayEl = dayEls[i]
            var date1 = new Date(dayEl.dataset.time)
            if (date.getFullYear() == date1.getFullYear() && date.getMonth() == date1.getMonth() && date.getDate() == date1.getDate()) {
                dayEl.classList.add('day-active')
            } else {
                dayEl.classList.remove('day-active')
            }
        }
    } catch (error) {
        if (debug) console.log(error)
    }
}

function setTodayCommentCount() {
    var utc = parseInt(0 - new Date().getTimezoneOffset() / 60)
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://haojiezhe12345.top:82/madohomu/api/comments/count?utc=${utc}`);
    xhr.onload = () => {
        if (xhr.status == 200) {
            document.getElementById('todayCommentCount').innerHTML = xhr.responseText
            console.log('today comment count:', xhr.responseText)
        }
    }
    xhr.send();
}

function seekComment(seekCount) {
    commentDiv.style.scrollBehavior = 'smooth'
    var scrollpx = 200
    try {
        scrollpx = document.getElementById('loadingIndicatorBefore').nextElementSibling.getBoundingClientRect().width + 20
    } catch (error) {
        if (debug) console.log(error)
    }
    commentDiv.scrollLeft = (Math.round((commentDiv.scrollLeft) / scrollpx) + seekCount) * scrollpx
    setTimeout(() => {
        commentDiv.style.removeProperty('scroll-behavior')
    }, 500);
}

// toggles
//
function toggleFullscreen() {
    if (!isFullscreen) {
        var scrollPercent = commentDiv.scrollLeft / (commentDiv.scrollWidth - commentDiv.clientWidth)
        setTimeout(() => {
            commentDiv.scrollTop = (commentDiv.scrollHeight - commentDiv.clientHeight) * scrollPercent
            setTimelineActiveMonth(true)
        }, 50);
        document.body.classList.add('fullscreen')
        document.getElementById('fullscreenBtn').innerHTML = '<span class="ui zh">退出全屏 ↙</span><span class="ui en">Collapse ↙</span>'
        isFullscreen = true
    } else {
        var scrollPercent = commentDiv.scrollTop / (commentDiv.scrollHeight - commentDiv.clientHeight)
        setTimeout(() => {
            commentDiv.scrollLeft = (commentDiv.scrollWidth - commentDiv.clientWidth) * scrollPercent
            setTimelineActiveMonth(true)
        }, 50);
        document.body.classList.remove('fullscreen')
        document.getElementById('fullscreenBtn').innerHTML = '<span class="ui zh">全屏 ↗</span><span class="ui en">Expand ↗</span>'
        isFullscreen = false
    }
    pauseCommentScroll = true
    setTimeout(() => {
        pauseCommentScroll = false
    }, 500);
}

function toggleTopComment() {
    setConfig('hideTopComment', hideTopCommentElmnt.checked)
    if (hideTopCommentElmnt.checked) {
        document.getElementById('topComment').style.display = 'none'
        topComment = document.getElementById('topComment').outerHTML
    } else {
        document.getElementById('topComment').style.removeProperty('display')
        topComment = document.getElementById('topComment').outerHTML
    }
}

function toggleTimeline() {
    setConfig('showTimeline', showTimelineElmnt.checked)
    if (showTimelineElmnt.checked) {
        document.getElementById('timelineContainer').style.display = 'block'
        commentDiv.classList.add('noscrollbar')
    } else {
        document.getElementById('timelineContainer').style.display = 'none'
        commentDiv.classList.remove('noscrollbar')
    }
}

function toggleKami() {
    setConfig('showKami', showKamiElmnt.checked)
}

// utilities
//
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

function setCookie(cname, cvalue, exdays = 999) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function getConfig(key) {
    if (localStorage.getItem(key) == null) {
        if (getCookie(key) != '') {
            setConfig(key, getCookie(key))
            document.cookie = `${key}=;expires=${new Date(0).toUTCString()};path=/`;
        } else {
            return ''
        }
    }
    return localStorage.getItem(key)
}

function setConfig(key, value) {
    if (value === '') {
        localStorage.removeItem(key)
    } else {
        localStorage.setItem(key, value)
    }
}

function html2elmnt(html) {
    html = html.trim()
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
}

function htmlEscape(txt) {
    return txt
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
        .replace(/\s/g, "&nbsp;")
}

function compareArr(a1, a2) {
    //if (debug) console.log(a1, a2)
    for (let i = 0; i < a1.length; i++) {
        if (a1[i] != a2[i]) {
            return a1[i] - a2[i]
        } else {
            continue
        }
    }
    return 0
}

function obj2queryString(obj) {
    if (obj.length == 0) return ''
    var arr = []
    for (key in obj) {
        arr.push(`${key}=${obj[key]}`)
    }
    return '?' + arr.join('&')
}

function getFileListAsync(url) {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => Promise.all([res.url, res.text()])).then(([url, text]) => {
            const doc = document.createElement('template')
            doc.innerHTML = text
            //console.log(url, doc)
            const filelist = []
            const alist = doc.content.querySelectorAll('a')
            for (let i = 0; i < alist.length; i++) {
                let a = alist[i]
                if (a.previousSibling && !a.previousSibling.textContent.includes('<dir>')) {
                    filelist.push(url + encodeURIComponent(a.textContent))
                }
            }
            resolve(filelist)
        })
    })
}

function getFileNameWithoutExt(path, decodeuri = false) {
    if (decodeuri) {
        return decodeURIComponent(path.match(/[^\\/]+(?=\.\w+$)/)[0])
    }
    else {
        return path.match(/[^\\/]+(?=\.\w+$)/)[0]
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getArrayNextItem(arr, item) {
    let x = arr[arr.indexOf(item) + 1]
    return x != null ? x : arr[0]
}

function getArrayPrevItem(arr, item) {
    let x = arr[arr.indexOf(item) - 1]
    return x != null ? x : arr[arr.length - 1]
}

function logErr(err, msg) {
    console.warn(err)
    console.error(msg)
}


// common vars
//
var pauseCommentScroll = false
var commentsUpToDate = false
var maxTimelineTime = 0

var userCommentUser = ''
var userCommentOffset = 0
var userCommentIsKami = false

// document elmnts
var commentDiv = document.getElementById('comments')
var captionDiv = document.getElementById('mainCaptions')
var userCommentEl = document.getElementById('userComment')

var setAvatarImg = document.getElementById('setAvatarImg')
var avatarInput = document.getElementById('setAvatarInput')

var hoverCalendarEl = document.getElementById('hoverCalendar')

// toggle checkboxes
var hideTopCommentElmnt = document.getElementById('hideTopComment')
var showTimelineElmnt = document.getElementById('showTimeline')
var showKamiElmnt = document.getElementById('showKami')

// raw htmls
var topComment = document.getElementById('topComment').outerHTML
var loadingIndicator = document.getElementById('loadingIndicator').outerHTML
var loadingIndicatorBefore = document.getElementById('loadingIndicatorBefore').outerHTML
document.getElementById('loadingIndicatorBefore').style.display = 'none'

// ui states
var bgPaused = false
var isFullscreen = false
var newCommentDisabled = false
var isLoadCommentErrorShowed = false


// set title link href
document.querySelector('#mainTitle>a').href = location.origin + location.pathname

// set language
changeLang(getConfig('lang'))

var debug = false
if (location.hash == '#debug') {
    debug = true
    document.getElementById('lowerPanel').classList.add('lowerPanelUp')
}


// show popup by hash
if (location.hash.slice(0, 7) == '#popup-') {
    try {
        showPopup(location.hash.slice(7))
    } catch (error) {
        closePopup()
        location.hash = ''
    }
}


// theme
//
var theme = 'default'

var d = new Date()
if (d.getMonth() + 1 == 10 && d.getDate() == 3) {
    theme = 'birthday'
}
else if ((d.getMonth() + 1 == 12 && d.getDate() == 25) || (d.getMonth() + 1 == 12 && d.getDate() == 26 && d.getHours() < 6)) {
    theme = 'christmas'
}
else if ((d.getMonth() + 1 == 2 && 10 <= d.getDate() && d.getDate() <= 15) || (d.getMonth() + 1 == 2 && d.getDate() == 9 && d.getHours() >= 6)) {
    theme = 'lunarNewYear'
}
else if (d.getHours() >= 23 || d.getHours() <= 5) {
    theme = 'night'
}

var themes = {
    '#default-theme': 'default',
    '#birthday': 'birthday',
    '#christmas': 'christmas',
    '#lunarNewYear': 'lunarNewYear',
    '#night': 'night',
    '#kami': 'kami',
}

for (var key in themes) {
    if (location.hash == key) {
        theme = themes[key]
    }
}

try {
    document.getElementById(`themeTxt-${theme}`).style.display = 'inline'
} catch (error) {
    console.log('theme indicator text not defined')
}

// theme-specific options
if (theme == 'birthday') {
    var yearsOld = d.getFullYear() - 2011
    document.getElementById('birthdayDate').innerHTML = `10/3/${d.getFullYear()} - Madoka's ${yearsOld}th birthday`
} else if (theme == 'lunarNewYear') {
    document.getElementsByClassName('fireworks')[0].style.display = 'block'
} else if (theme == 'kami') {
    try {
        printParaCharOneByOne(document.getElementsByClassName('kamiCaption')[0], 750)
    } catch (error) {
        console.log(error)
    }
}


// cookies toggles
//
if (getConfig('graphicsMode') != '') {
    changeGraphicsMode(getConfig('graphicsMode'))
}

if (getConfig('hideTopComment') == 'true') {
    hideTopCommentElmnt.checked = true
    document.getElementById('topComment').style.display = 'none'
    topComment = document.getElementById('topComment').outerHTML
}

if (getConfig('hiddenBanner') != document.getElementById('banner').classList[0]) {
    //document.getElementById('banner').style.display = 'block'
}

if (getConfig('showTimeline') == 'false') {
    showTimelineElmnt.checked = false
    toggleTimeline()
}

if (getConfig('showKami') == 'true' || theme == 'kami') {
    showKamiElmnt.checked = true
} else if (getConfig('showKami') == 'false') {
    showKamiElmnt.checked = false
}


// background images
//
var bgCount
bgCount = document.getElementsByClassName(`${theme}bg`).length

// for single-image theme, show only the first image and disable slideshow
if (bgCount == 1) {
    document.getElementsByClassName(`${theme}bg`)[0].style.opacity = 1
    document.getElementsByClassName(`${theme}bg`)[0].style.display = 'block'
    document.getElementsByClassName(`${theme}bg`)[0].firstElementChild.style.backgroundImage = `url("https://haojiezhe12345.top:82/madohomu/bg/${theme}/mainbg1.jpg")`

    document.getElementsByClassName(`${theme}Caption`)[0].style.display = 'block'
    setTimeout(() => {
        captionDiv.style.opacity = 1
    }, 500);

    bgPaused = true
}

var currentBG = bgCount - 1
var currentCaption = -1

function playBG() {
    document.getElementsByClassName(`${theme}bg`)[0].classList.add('bgzoom')
    nextImg()
    setInterval(nextImg, 8000)
    setTimeout(() => {
        document.getElementsByClassName(`${theme}bg`)[0].classList.remove('bgzoom')
    }, 10000);

    nextCaption()
    setInterval(nextCaption, 8000)
}
if (location.hash == '#video') {
    time_ms = 5000
    playWalpurgis(time_ms)

    document.getElementsByClassName('walpurgisbg')[0].style.opacity = 1
    document.getElementsByClassName('walpurgisbg')[0].style.display = 'block'
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.backgroundImage = `url("https://haojiezhe12345.top:82/madohomu/bg/walpurgis/mainbg1.jpg")`
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.animationName = 'bgzoom'
    document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.animationDuration = '1.5s'

    var unmuteBGM = false
    if (bgmElmnt.muted == false) {
        bgmElmnt.muted = true
        unmuteBGM = true
    }
    setTimeout(() => {
        document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.removeProperty('animation-name')
        document.getElementsByClassName('walpurgisbg')[0].firstElementChild.style.removeProperty('animation-duration')
        setTimeout(() => {
            document.getElementsByClassName('walpurgisbg')[0].style.opacity = 0
            playBG()
            setTimeout(() => {
                if (unmuteBGM) {
                    bgmElmnt.muted = false
                }
            }, 2000);
        }, 8000);
    }, time_ms);

} else {
    playBG()
}


// user (login not implemented)
//
loadUserInfo()


// comments
//
loadComments()
setTimeout(() => {
    commentDiv.addEventListener("scroll", commentScroll)
}, 500);
setInterval(commentScroll, 1000)

var commentHorizontalScrolled = 0
var altScrollmode = false

commentDiv.addEventListener("wheel", (event) => {
    if (!isFullscreen) {
        if (altScrollmode == 1) {
            console.info(event.deltaY)
            console.info(commentDiv.scrollLeft)
            commentHorizontalScrolled += event.deltaY * 1
            if (commentHorizontalScrolled < 0)
                commentHorizontalScrolled = 0
            if (commentHorizontalScrolled > (commentDiv.scrollWidth - commentDiv.clientWidth))
                commentHorizontalScrolled = commentDiv.scrollWidth - commentDiv.clientWidth
            console.log(commentHorizontalScrolled)
            commentDiv.scrollLeft = commentHorizontalScrolled
        } else if (altScrollmode == 2 && event.deltaX == 0) {
            console.info(event)
            const e1 = new WheelEvent("wheel", {
                deltaX: event.deltaY,
                deltaMode: 0,
            });
            console.info(e1)
            commentDiv.dispatchEvent(e1)
        } else if (altScrollmode == 3) {
            (event.deltaY > 0) ? seekComment(1) : seekComment(-1)
        } else {
            commentDiv.scrollLeft += event.deltaY
        }
    }
});

const msgBgInfo = [
    {
        'description': 'Official Guidebook "You Are Not Alone"',
    },
    {
        'illustrator': 'Nine',
        'pixivid': '57114653',
    },
    {
        'illustrator': '曼曼',
        'pixivid': '91471007',
    },
    {
        'illustrator': 'カラスBTK',
        'pixivid': '99591809',
    },
    {
        'illustrator': 'さんしょう',
        'pixivid': '18530512',
    },
    {
        'illustrator': 'STAR影法師',
        'pixivid': '60649948',
    },
    {
        'illustrator': 'Nardack',
        'pixivid': '88198018',
    },
    {
        'illustrator': 'Rella',
        'pixivid': '29076044',
    },
    {
        'illustrator': 'おれつ',
        'pixivid': '57636925',
    },
    {
        'illustrator': 'ChrisTy☆クリスティ',
        'pixivid': '65489049',
    },
    {
        'illustrator': 'ChrisTy☆クリスティ',
        'pixivid': '63582832',
    },
]
const msgBgCount = msgBgInfo.length
var lastBgImgs = []


// timeline
//
document.getElementById('timelineContainer').addEventListener('click', (event) => {
    //if (debug) console.log(event.target)
    if (event.target.nodeName == 'STRONG') {
        var year = parseInt(event.target.innerHTML)
        if (event.target == document.getElementById('timeline').firstElementChild.firstElementChild) {
            clearComments()
            loadComments()
            return
        }
        var date = new Date(year + 1, 0, 0)
    } else if (event.target.nodeName == 'SPAN') {
        if (event.target.classList[0] == 'month-active') return
        var year = parseInt(event.target.parentNode.firstElementChild.innerHTML)
        var month = parseInt(event.target.innerHTML)
        var date = new Date(year, month - 1)
    } else if (event.target.hasAttribute('data-time')) {
        var date = new Date(event.target.dataset.time)
    } else return
    var timestamp = date.getTime() / 1000
    //console.log(timestamp)
    clearComments(1)
    if (timestamp <= 1684651800) {
        loadComments({ 'time': timestamp, 'db': 'kami' })
    } else {
        loadComments({ 'time': timestamp })
    }
})

document.getElementById('timelineContainer').addEventListener('wheel', (event) => {
    if (!isFullscreen)
        document.getElementById('timeline').scrollLeft += event.deltaY / 2
})

document.getElementById('timelineContainer').addEventListener('mouseover', (event) => {
    if (event.target.nodeName == 'SPAN') {
        if (!isFullscreen) {
            var left = event.target.getBoundingClientRect().left + event.target.getBoundingClientRect().width / 2
            var width = 113
            if (left + width > window.innerWidth) left = window.innerWidth - width
            if (left < width) left = width
            hoverCalendarEl.style.left = left + 'px'
            hoverCalendarEl.style.bottom = document.getElementById('timelineContainer').getBoundingClientRect().height + 'px'
            hoverCalendarEl.style.removeProperty('top')
            hoverCalendarEl.style.removeProperty('right')
        }
        else {
            hoverCalendarEl.style.top = event.target.getBoundingClientRect().top + event.target.getBoundingClientRect().height / 2 + 'px'
            hoverCalendarEl.style.right = document.getElementById('timelineContainer').getBoundingClientRect().width + 'px'
            hoverCalendarEl.style.removeProperty('left')
            hoverCalendarEl.style.removeProperty('bottom')
        }
        hoverCalendarEl.style.removeProperty('display')

        hoverCalendarEl.innerHTML = ''
        var year = parseInt(event.target.parentNode.firstElementChild.innerHTML)
        var month = parseInt(event.target.innerHTML)
        hoverCalendarEl.appendChild(html2elmnt(`<div>${year}-${('0' + month).slice(-2)}${(year <= 2022 || (year == 2023 && month <= 5)) ? ' (kami.im)' : ''}</div>`))
        for (let i = 1; i <= new Date(year, month, 0).getDate(); i++) {
            if (new Date(year, month - 1, i).getTime() / 1000 < maxTimelineTime)
                hoverCalendarEl.appendChild(html2elmnt(`<div data-time="${new Date(year, month - 1, i).toDateString()}">${i}</div>`))
        }
        setHoverCalendarActiveDay()
    } else if (event.target.nodeName == 'STRONG') {
        hoverCalendarEl.style.display = 'none'
    }
})

document.getElementById('goto').addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        clearComments(1);
        loadComments({ 'from': document.getElementById('goto').value })
    }
})


// image viewer
//
const imgViewer = {
    elements: {
        container: document.getElementById('imgViewerBox'),
        viewer: document.getElementById('imgViewer'),
        viewport: document.getElementById('viewport1'),
    },

    viewportContent: '',
    imgViewerOffsetX: 0,
    imgViewerOffsetY: 0,
    imgViewerScale: 1,
    imgViewerMouseMoved: false,

    view(src) {
        this.elements.viewer.src = src
        this.elements.container.style.removeProperty('display')
        this.elements.viewport.setAttribute('content', this.viewportContent.replace(', maximum-scale=1.0', ''))
        window.location.hash = 'view-img'

        this.imgViewerOffsetX = 0
        this.imgViewerOffsetY = 0
        this.imgViewerScale = 1
        this.elements.viewer.style.transform = 'translateX(0px) translateY(0px) scale(1)'
        this.elements.viewer.style.removeProperty('image-rendering')
    },

    close() {
        if (location.hash == '#view-img') {
            history.back()
            return
        }

        this.elements.container.style.display = 'none';
        this.elements.viewport.setAttribute('content', this.viewportContent);
    },

    isOpen() {
        return this.elements.container.style.display != 'none' ? true : false
    },

    init() {
        this.viewportContent = this.elements.viewport.getAttribute('content')

        this.elements.container.onmousedown = e => {
            if (e.button == 0) {
                this.imgViewerMouseMoved = false
                this.elements.viewer.style.transition = 'none'
            }
        }
        this.elements.container.onmouseup = e => {
            if (e.button == 0) {
                if (!this.imgViewerMouseMoved) {
                    this.close()
                }
                this.elements.viewer.style.removeProperty('transition')
            }
        }
        this.elements.container.onmousemove = e => {
            if (e.buttons == 1) {
                this.imgViewerOffsetX += e.movementX
                this.imgViewerOffsetY += e.movementY
                if (e.movementX != 0 || e.movementY != 0) {
                    this.imgViewerMouseMoved = true
                }
                //console.log(this.imgViewerOffsetX, this.imgViewerOffsetY)
                this.elements.viewer.style.transform = `translateX(${this.imgViewerOffsetX}px) translateY(${this.imgViewerOffsetY}px) scale(${this.imgViewerScale})`
            }
        }
        this.elements.container.onwheel = e => {
            e.preventDefault()
            let scaleMultiplier = 1
            if (e.deltaY < 0) {
                scaleMultiplier = (1000 - e.deltaY) / 1000
                //this.imgViewerScale *= 11 / 10
            } else {
                scaleMultiplier = 1000 / (1000 + e.deltaY)
                //this.imgViewerScale *= 10 / 11
            }
            this.imgViewerScale *= scaleMultiplier

            var mouseOffsetX = e.clientX - (document.documentElement.clientWidth / 2)
            var mouseOffsetY = e.clientY - (document.documentElement.clientHeight / 2)
            if (debug) console.log(mouseOffsetX, mouseOffsetY)

            this.imgViewerOffsetX += (scaleMultiplier - 1) * (this.imgViewerOffsetX - mouseOffsetX)
            this.imgViewerOffsetY += (scaleMultiplier - 1) * (this.imgViewerOffsetY - mouseOffsetY)

            if (this.imgViewerScale < 1) {
                this.imgViewerScale = 1
                this.imgViewerOffsetX = 0
                this.imgViewerOffsetY = 0
            }
            if (debug) console.log(this.imgViewerScale)

            this.elements.viewer.style.transform = `translateX(${this.imgViewerOffsetX}px) translateY(${this.imgViewerOffsetY}px) scale(${this.imgViewerScale})`
            if (this.imgViewerScale > 3) {
                this.elements.viewer.style.imageRendering = 'pixelated'
            } else {
                this.elements.viewer.style.removeProperty('image-rendering')
            }
        }
    },
}

const viewImg = src => imgViewer.view(src)
const closeImgViewer = () => imgViewer.close()
try {
    imgViewer.init()
} catch (error) {
    logErr(error, 'Failed to init image viewer')
}


// music player
//
const MusicPlayer = {
    elements: {
        player: document.getElementById('musicAudio'),
        playerImg: document.getElementById('musicImg'),
        playBtn: document.getElementById('musicPlayBtn'),
        playingIndicators: document.getElementsByClassName('musicPlayingIndicator'),
        titles: document.getElementsByClassName('currentSong'),
        progress: document.getElementById('nowPlayingProgress').firstElementChild,
        list: document.getElementById('songList'),
        shuffleBtn: document.getElementById('musicShuffleBtn'),
    },

    playList: [],
    playOrder: [],
    preferredSongs: [/.*/],
    userPaused: true,

    loadPlayList(dir) {
        this.elements.list.innerHTML = ''
        getFileListAsync(dir).then(list => {
            list = list.filter(item => !(item.endsWith('.jpg') || item.endsWith('.disabled')))
            let preferred = []
            for (let i = 0; i < list.length; i++) {
                for (let song of this.preferredSongs) {
                    if (song.test(decodeURIComponent(list[i]))) {
                        preferred.push(list.splice(i, 1)[0])
                        break
                    }
                }
            }
            shuffleArray(preferred)
            this.playList = [...preferred, ...list]
            this.playOrder = []
            this.showPlayList(this.playList)
            if (this.playList[0]) this.setActiveSong(0)
        })
    },

    showPlayList(list) {
        for (let url of list) {
            this.elements.list.appendChild(html2elmnt(`
                <li>${getFileNameWithoutExt(url, true)}</li>
            `))
        }
    },

    setActiveSong(index) {
        this.elements.player.src = this.playList[index]
        this.elements.playerImg.src = this.playList[index] + '.jpg'
        this.elements.playerImg.onclick = function () { viewImg(this.src) }
        this.elements.playerImg.onerror = function () {
            this.onerror = null
            this.onclick = null
            this.src = 'https://haojiezhe12345.top:82/madohomu/res/music_note.svg'
        }
        for (let i = 0; i < this.elements.titles.length; i++) {
            this.elements.titles[i].textContent = getFileNameWithoutExt(this.playList[index], true)
        }
        for (let i = 0; i < this.elements.list.children.length; i++) {
            this.elements.list.children[i].classList.remove('playing')
        }
        this.elements.list.children[index].classList.add('playing')

        if (navigator.mediaSession) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: getFileNameWithoutExt(this.playList[index], true),
                artist: 'MadoHomu.love',
                artwork: [{ src: this.playList[index] + '.jpg' }]
            })
        }
    },

    getPlayingIndex() {
        for (let i = 0; i < this.elements.list.children.length; i++) {
            if (this.elements.list.children[i].classList.contains('playing')) {
                return i
            }
        }
        return 0
    },

    checkPlayOrder() {
        if (this.playOrder.length != this.playList.length) {
            this.playOrder = [...Array(this.playList.length).keys()]
            if (this.elements.shuffleBtn.checked) {
                shuffleArray(this.playOrder)
            }
        }
    },

    play(index = null) {
        if (index == null && !this.elements.player.src && this.playList.length > 0) index = 0
        if (index != null) this.setActiveSong(index)
        this.elements.player.play()
        this.userPaused = false
        setConfig('mutebgm', false)
    },

    playNext() {
        this.checkPlayOrder()
        this.play(getArrayNextItem(this.playOrder, this.getPlayingIndex()))
    },

    playPrev() {
        this.checkPlayOrder()
        this.play(getArrayPrevItem(this.playOrder, this.getPlayingIndex()))
    },

    pause() {
        this.userPaused = true
        setConfig('mutebgm', true)
        this.elements.player.pause()
    },

    initPlayer(dir) {
        this.loadPlayList(dir)
        if (getConfig('mutebgm') == 'true') {
            this.userPaused = true
        } else {
            this.userPaused = false
            this.play()
        }

        this.elements.playBtn.onclick = () => {
            if (this.elements.playBtn.classList.contains('playing')) {
                this.pause()
            } else {
                this.play()
            }
        }
        this.elements.list.onclick = e => {
            if (Array.from(this.elements.list.children).includes(e.target)) {
                this.play(Array.from(this.elements.list.children).indexOf(e.target))
            }
        }
        this.elements.progress.parentNode.onclick = e => {
            let percent = e.offsetX / this.elements.progress.parentNode.offsetWidth
            this.elements.player.currentTime = this.elements.player.duration * percent
            this.elements.progress.style.width = `${percent * 100}%`
        }
        this.elements.shuffleBtn.onchange = () => {
            this.playOrder = []
        }
        this.elements.list.parentNode.parentNode.querySelector('button').onmouseenter = () => {
            this.elements.list.querySelector('.playing').scrollIntoView({ block: "center" })
        }

        this.elements.player.onplay = () => {
            for (let i = 0; i < this.elements.playingIndicators.length; i++) {
                this.elements.playingIndicators[i].classList.add('playing');
            }
        }
        this.elements.player.onpause = () => {
            for (let i = 0; i < this.elements.playingIndicators.length; i++) {
                this.elements.playingIndicators[i].classList.remove('playing');
            }
        }
        this.elements.player.onended = () => {
            this.playNext()
        }

        setInterval(() => {
            this.elements.progress.style.width = `${this.elements.player.currentTime / this.elements.player.duration * 100}%`
        }, 500);

        if (navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('play', () => this.play())
            navigator.mediaSession.setActionHandler('pause', () => this.pause())
            navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrev())
            navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext())
        }
    },
}

try {
    // play theme-specific BGMs
    if (theme == 'birthday') {
        MusicPlayer.preferredSongs = [/また あした - 悠木碧/]
    } else if (theme == 'night') {
        MusicPlayer.preferredSongs = [/Scaena felix - オルゴール ミドリ/]
    } else if (theme == 'kami') {
        MusicPlayer.preferredSongs = [/never leave you alone - 梶浦由記/]
    } else {
        MusicPlayer.preferredSongs = [
            /Sagitta luminis - オルゴール ミドリ/,
            /君の銀の庭 - オルゴール ミドリ/,
        ]
    }
    MusicPlayer.initPlayer('https://haojiezhe12345.top:82/madohomu/media/bgm/')
} catch (error) {
    logErr(error, 'failed to init music player')
}


// iframe communication
//
const iframeCom = {
    elements: {
        pageZoomController: document.getElementById('pageZoomController'),
        safeZoneSetting: document.getElementById('safeZoneSetting'),
    },

    send(type, data) {
        window.parent.postMessage({ type, data }, '*')
    },

    init() {
        if (window.parent == window) return
        window.addEventListener('message', e => {
            switch (e.data.type) {
                case 'iframeCaps':
                    let caps = e.data.data
                    if (caps.includes('setPageZoom')) {
                        this.elements.pageZoomController.removeAttribute('disabled')
                    }
                    if (caps.includes('setSafezone')) {
                        this.elements.safeZoneSetting.removeAttribute('disabled')
                    }
                    break;

                case 'pageZoom':
                    this.elements.pageZoomController.value = e.data.data
                    break;

                default:
                    break;
            }
        })
        this.send('checkIframeCaps')
    },
}

try {
    iframeCom.init()
} catch (error) {
    logErr(error, 'failed to check init iframe communication')
}


// global Esc key handler
//
document.onkeydown = function (e) {
    //console.log(e.key)
    if (e.key == 'Escape' || e.keyCode == 27) {
        if (imgViewer.isOpen()) {
            closeImgViewer()
        } else if (popup.isOpen()) {
            closePopup()
        } else if (isFullscreen) {
            toggleFullscreen()
        } else {
            document.getElementById('lowerPanel').classList.remove('lowerPanelUp')
        }
    }
}


// hash change handler
//
if (window.location.hash == '#view-img' || window.location.hash == '#popup') {
    window.location.hash = ''
}

window.onhashchange = function (e) {
    //console.log(e.oldURL.split('#')[1], e.newURL.split('#')[1])
    if (e.oldURL.split('#')[1] == 'view-img') {
        closeImgViewer()
    }
    if (e.oldURL.split('#')[1] == 'popup' && e.newURL.split('#')[1] != 'view-img') {
        closePopup()
    }
}


// detect touch keyboard
// NEED IMPROVEMENT: MI Browser changes viewport dynamically, and when keyboard is closing, 
//                   the viewport goes: 500x700 -> 500x1100 -> 500x1000, which may accidentally trigger this layout.
//
var prevWindowWidth = null
var prevWindowHeight = null

window.onresize = () => {
    var newWindowWidth = window.innerWidth
    var newWindowHeight = window.innerHeight
    //if (debug) console.log(`${prevWindowWidth}x${prevWindowHeight} -> ${newWindowWidth}x${newWindowHeight}`)

    var newCommentBoxEl = document.getElementById('newCommentBox')
    if (newCommentBoxEl != null && document.activeElement == document.getElementById('msgText') && newWindowHeight < prevWindowHeight) {
        if (!document.body.classList.contains('touchKeyboardShowing') && (newCommentBoxEl.offsetHeight < 380)) {
            console.log('detected editing newComment with touch keyboard')
            document.body.classList.add('touchKeyboardShowing')
        }
    } else {
        //if (debug) console.log('leaving editing newComment with touch keyboard')
        document.body.classList.remove('touchKeyboardShowing')
    }
    prevWindowWidth = newWindowWidth
    prevWindowHeight = newWindowHeight
}


// PWA init
//
var installPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    //console.log(`'beforeinstallprompt' event was fired.`);
});

var isInStandaloneMode = false
isInStandaloneMode = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');


// everything is now initiated
//
jsLoaded = true
