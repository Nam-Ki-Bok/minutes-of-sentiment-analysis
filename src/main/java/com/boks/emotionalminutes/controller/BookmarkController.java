package com.boks.emotionalminutes.controller;

import com.boks.emotionalminutes.domain.bookmark.Bookmark;
import com.boks.emotionalminutes.service.BookmarkService;
import com.boks.emotionalminutes.web.dto.bookmark.BookmarkRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
public class BookmarkController {
    private final BookmarkService bookmarkService;

    @GetMapping("/api/bookmark/{id}")

    @PostMapping("/api/bookmark")
    public Long save(@RequestBody BookmarkRequestDto requestDto) {
        return bookmarkService.save(requestDto);
    }

    @PutMapping("/api/bookmark/update/{id}")
    public Long update(@PathVariable Long id, @RequestBody String memo) {
        return bookmarkService.update(id, memo);
    }

    @DeleteMapping("/api/bookmark/delete/{id}")
    public void delete(@PathVariable Long id) {
        bookmarkService.delete(id);
    }
}
