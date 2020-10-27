import React from 'react';
import Guide from './guide_comp';
export default function(){
    let guide = {
        header: 'Editor App',
        id: 'editor_guide',
        array: [
            'Đây có lẽ là thứ khiến tác giả @linhletd bị "sa lầy" khi thực hiện, mặc dù vẻ bề ngoài chỉ có vài nút bấm và một ô trống lớn thô thiển',
            'Nhưng đứng sau nó là khoảng 4000 dòng code javascript, một lô những thứ như: depth first search (DFS), Breadth first search (BFS), tree, double linked list, recursion, iterator',
            'Nhiều ứng dụng tương tự có thể bạn gặp được xây dựng dễ dàng hơn nhờ "execCommand API", nhưng app dưới đây không như vậy',
            'Khi tôi tìm hiểu về "execCommand API" - thứ mà hoạt động khác nhau trên các trình duyệt, theo MDN (Mozilla Developer Network), nó đã lỗi thời và có thể bị loại bỏ bất cứ lúc nào :(',
            'Nhưng cuối cùng, tôi đã tìm ra giải pháp thay thế. Sử dụng mutation observer để quản lý "undo, redo", sử dụng range, selection cho DOM manipulation',
            'Tính năng của app hoàn toàn có thể mở rộng (vẫn có một số lỗi), nhưng do đã quá "mệt" và hạn chế thời gian nên tôi chỉ dừng ở mức độ này...'
        ]
    }
    return <Guide data = {guide}/>
}